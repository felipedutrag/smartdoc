import fs from "fs";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

export interface KnowledgeMatch {
  source: string;
  topic: string;
  content: string;
  score: number;
}

/**
 * Reranking Inteligente via Gemini Flash para ordenar teses por pertinência fática
 */
async function rerankMatchesWithGemini(
  queryOrFacts: string,
  candidates: KnowledgeMatch[],
  topK: number = 3
): Promise<KnowledgeMatch[]> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || candidates.length <= topK) {
    return candidates.slice(0, topK);
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      },
      systemInstruction: `
Você é um Juiz e Processualista Especialista em Relevância Jurisprudencial.
Sua missão é receber uma lista de teses jurídicas candidatas e o caso fático do advogado, e selecionar as ${topK} teses com MAIOR aderência direta e poder de convencimento para o caso.
Retorne um JSON contendo o array com os índices ordenados das melhores teses:
{ "selectedIndices": [0, 2, 1] }
`,
    });

    const prompt = `CASO FÁTICO DO ADVOGADO:
"""
${queryOrFacts.slice(0, 2500)}
"""

TESES CANDIDATAS ENCONTRADAS:
${candidates
  .map(
    (c, idx) => `[Índice ${idx}] FONTE: ${c.source} | TÓPICO: ${c.topic}
${c.content.slice(0, 500)}...`
  )
  .join("\n\n")}

Selecione os índices das ${topK} teses mais estritamente pertinentes:`;

    const res = await model.generateContent(prompt);
    const text = res.response?.text() || "{}";
    const parsed = JSON.parse(text);

    if (Array.isArray(parsed.selectedIndices) && parsed.selectedIndices.length > 0) {
      const reranked: KnowledgeMatch[] = [];
      for (const idx of parsed.selectedIndices) {
        if (candidates[idx]) {
          reranked.push(candidates[idx]);
        }
      }
      if (reranked.length > 0) return reranked.slice(0, topK);
    }
  } catch (err) {
    console.warn("[RAG RERANKER] Falha no rerank via Gemini Flash, mantendo ranking padrão:", err);
  }

  return candidates.slice(0, topK);
}

/**
 * Busca Híbrida Forense (pgvector + Busca Léxica com Reciprocal Rank Fusion)
 */
export async function searchSemanticLegalKnowledge(queryOrFacts: string, maxResults: number = 3): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const vectorMatches: KnowledgeMatch[] = [];

  if (geminiKey && supabaseUrl && supabaseServiceKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Gera o embedding da query com dimensão 2048
      const embRes = await embeddingModel.embedContent({
        content: { parts: [{ text: queryOrFacts.slice(0, 3000) }] },
        outputDimensionality: 2048,
      } as any);

      const queryEmbedding = embRes.embedding.values;

      // Busca vetorial por similaridade de cosseno
      const { data, error } = await supabase.rpc("match_legal_knowledge", {
        query_embedding: queryEmbedding,
        match_threshold: 0.30,
        match_count: 8,
      });

      if (!error && data && data.length > 0) {
        for (const item of data) {
          vectorMatches.push({
            source: item.source || "Base STF/STJ",
            topic: item.topic || item.source || "Jurisprudência",
            content: item.content,
            score: item.similarity || 0.5,
          });
        }
      }
    } catch (vectorErr) {
      console.warn("[RAG VETORIAL] Falha na busca vetorial remota, prosseguindo com busca léxica híbrida:", vectorErr);
    }
  }

  // Busca Léxica Local de Alta Precisão (BM25 / Regex Ponderada para Artigos e Súmulas)
  const lexicalMatches = searchLegalKnowledgeRaw(queryOrFacts, 8);

  // Reciprocal Rank Fusion (RRF) combinando Vetorial + Léxico
  const rrfMap = new Map<string, { match: KnowledgeMatch; rrfScore: number }>();
  const k = 60; // Constante canônica RRF

  vectorMatches.forEach((match, rank) => {
    const key = match.content.trim().slice(0, 120).toLowerCase();
    const current = rrfMap.get(key) || { match, rrfScore: 0 };
    current.rrfScore += 1 / (k + rank + 1);
    rrfMap.set(key, current);
  });

  lexicalMatches.forEach((match, rank) => {
    const key = match.content.trim().slice(0, 120).toLowerCase();
    const current = rrfMap.get(key) || { match, rrfScore: 0 };
    current.rrfScore += 1 / (k + rank + 1);
    rrfMap.set(key, current);
  });

  let fusedCandidates = Array.from(rrfMap.values())
    .sort((a, b) => b.rrfScore - a.rrfScore)
    .map((item) => ({ ...item.match, score: item.rrfScore }));

  if (fusedCandidates.length === 0) {
    return "";
  }

  // Reranking via LLM se houver candidatos múltiplos
  const topMatches = await rerankMatchesWithGemini(queryOrFacts, fusedCandidates, maxResults);

  let output = "\n=== PRECEDENTES E TESES PERTINENTES LOCALIZADOS NA BASE (BUSCA HÍBRIDA STF/STJ) ===\n";
  for (const m of topMatches) {
    output += `\n[Fonte: ${m.source} | Tópico: ${m.topic}]\n${m.content}\n`;
  }

  return output;
}

/**
 * Busca léxica ponderada para termos jurídicos exatos (Súmulas, Artigos, Leis)
 */
export function searchLegalKnowledgeRaw(queryOrFacts: string, maxResults: number = 8): KnowledgeMatch[] {
  try {
    const knowledgeDir = path.join(process.cwd(), "src", "knowledge");
    if (!fs.existsSync(knowledgeDir)) return [];

    const files = fs.readdirSync(knowledgeDir).filter((f) => f.endsWith(".md"));
    if (files.length === 0) return [];

    const stopwords = new Set([
      "a", "o", "as", "os", "um", "uma", "uns", "umas", "de", "do", "da", "dos", "das",
      "em", "no", "na", "nos", "nas", "por", "para", "com", "sem", "sob", "sobre",
      "que", "se", "ou", "e", "mas", "como", "qual", "quando", "onde", "quem",
      "este", "esta", "esse", "essa", "aquele", "aquela", "seu", "sua", "seus", "suas",
      "foi", "era", "são", "ser", "ter", "havia", "pelo", "pela", "pelos", "pelas",
    ]);

    const words = queryOrFacts
      .toLowerCase()
      .replace(/[^\wáàâãéèêíïóôõöúçñ\s]/gi, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopwords.has(w));

    // Expressões jurídicas críticas com alto peso
    const exactMatches = queryOrFacts.match(
      /(?:art(?:igo)?\.?\s*\d+|s[uú]mula\s*\d+|tema\s*\d+|lei\s*[\d\.\/]+|cdc|cpc|código civil|clt|constituição)/gi
    ) || [];

    if (words.length === 0 && exactMatches.length === 0) return [];

    const matches: KnowledgeMatch[] = [];

    for (const file of files) {
      const filePath = path.join(knowledgeDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const sections = content.split(/(?=\n- \*\*|\n## )/g);

      for (const section of sections) {
        const trimmed = section.trim();
        if (trimmed.length < 30) continue;

        const lowerSection = trimmed.toLowerCase();
        let score = 0;

        // Bônus para termos exatos (leis, números de súmula, temas)
        for (const exact of exactMatches) {
          if (lowerSection.includes(exact.toLowerCase())) {
            score += 15;
          }
        }

        // Frequência de termos gerais
        for (const word of words) {
          if (lowerSection.includes(word)) {
            score += 1;
            if (trimmed.startsWith("#") || trimmed.startsWith("- **")) {
              const firstLine = trimmed.split("\n")[0].toLowerCase();
              if (firstLine.includes(word)) score += 3;
            }
          }
        }

        if (score > 0) {
          matches.push({
            source: file.replace(".md", "").replace(/_/g, " ").toUpperCase(),
            topic: trimmed.split("\n")[0].replace(/^#+\s*|-\s*\*\*/, "").replace(/\*\*.*$/, "").trim(),
            content: trimmed,
            score,
          });
        }
      }
    }

    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, maxResults);
  } catch (error) {
    console.error("[KnowledgeBase] Erro na busca léxica:", error);
    return [];
  }
}

/**
 * Busca tradicional com saída formatada
 */
export function searchLegalKnowledge(queryOrFacts: string, maxResults: number = 3): string {
  const matches = searchLegalKnowledgeRaw(queryOrFacts, maxResults);
  if (matches.length === 0) return "";

  let output = "\n=== PRECEDENTES E TESES PERTINENTES LOCALIZADOS NA BASE (STF/STJ) ===\n";
  for (const m of matches) {
    output += `\n[Fonte: ${m.source} | Tópico: ${m.topic}]\n${m.content}\n`;
  }
  return output;
}

/**
 * Retorna os tópicos e precedentes específicos para o caso via RAG Híbrido
 */
export async function getLegalKnowledgeBase(query?: string): Promise<string> {
  if (query && query.trim().length > 0) {
    return await searchSemanticLegalKnowledge(query, 3);
  }
  return "";
}
