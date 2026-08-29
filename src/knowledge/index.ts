import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export interface KnowledgeMatch {
  source: string;
  topic: string;
  content: string;
  score: number;
}

/**
 * Busca Semântica Vetorial no Supabase (pgvector)
 */
export async function searchSemanticLegalKnowledge(queryOrFacts: string, maxResults: number = 3): Promise<string> {
  const nvidiaKey = process.env.NVIDIA_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (nvidiaKey && supabaseUrl && supabaseServiceKey) {
    try {
      const nvidia = new OpenAI({
        baseURL: "https://integrate.api.nvidia.com/v1",
        apiKey: nvidiaKey,
      });

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Gera o embedding da query
      const embRes = await nvidia.embeddings.create({
        model: "nvidia/nemotron-3-embed-1b",
        input: [queryOrFacts.slice(0, 3000)],
      });

      const queryEmbedding = embRes.data[0].embedding;

      // Executa busca vetorial por similaridade de cosseno
      const { data, error } = await supabase.rpc("match_legal_knowledge", {
        query_embedding: queryEmbedding,
        match_threshold: 0.40,
        match_count: maxResults,
      });

      if (!error && data && data.length > 0) {
        console.log(`[RAG VETORIAL] 🧠 Encontradas ${data.length} teses por similaridade semântica.`);
        let output = "\n=== PRECEDENTES E TESES PERTINENTES LOCALIZADOS NA BASE (BUSCA SEMÂNTICA STF/STJ) ===\n";
        for (const item of data) {
          output += `\n[Fonte: ${item.source} | Similaridade: ${Math.round((item.similarity || 0) * 100)}%]\n${item.content}\n`;
        }
        return output;
      }
    } catch (vectorErr) {
      console.warn("[RAG VETORIAL] Falha na busca vetorial, caindo para busca léxica:", vectorErr);
    }
  }

  // Fallback para busca léxica tradicional
  return searchLegalKnowledge(queryOrFacts, maxResults);
}

/**
 * Busca léxica tradicional de backup
 */
export function searchLegalKnowledge(queryOrFacts: string, maxResults: number = 3): string {
  try {
    const knowledgeDir = path.join(process.cwd(), "src", "knowledge");
    if (!fs.existsSync(knowledgeDir)) return "";

    const files = fs.readdirSync(knowledgeDir).filter(f => f.endsWith(".md"));
    if (files.length === 0) return "";

    const stopwords = new Set([
      "a", "o", "as", "os", "um", "uma", "uns", "umas", "de", "do", "da", "dos", "das",
      "em", "no", "na", "nos", "nas", "por", "para", "com", "sem", "sob", "sobre",
      "que", "se", "ou", "e", "mas", "como", "qual", "quando", "onde", "quem",
      "este", "esta", "esse", "essa", "aquele", "aquela", "seu", "sua", "seus", "suas",
      "foi", "era", "são", "ser", "ter", "havia", "pelo", "pela", "pelos", "pelas"
    ]);

    const words = queryOrFacts
      .toLowerCase()
      .replace(/[^\wáàâãéèêíïóôõöúçñ\s]/gi, " ")
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopwords.has(w));

    if (words.length === 0) return "";

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
            source: file,
            topic: trimmed.split("\n")[0].replace(/^#+\s*|-\s*\*\*/, "").replace(/\*\*.*$/, "").trim(),
            content: trimmed,
            score
          });
        }
      }
    }

    if (matches.length === 0) return "";

    matches.sort((a, b) => b.score - a.score);
    const topMatches = matches.slice(0, maxResults);

    let output = "\n=== PRECEDENTES E TESES PERTINENTES LOCALIZADOS NA BASE (STF/STJ) ===\n";
    for (const m of topMatches) {
      output += `\n[Fonte: ${m.source}]\n${m.content}\n`;
    }

    return output;
  } catch (error) {
    console.error("[KnowledgeBase] Erro na busca direcionada:", error);
    return "";
  }
}

/**
 * Retorna os tópicos e precedentes específicos para o caso
 */
export async function getLegalKnowledgeBase(query?: string): Promise<string> {
  if (query && query.trim().length > 0) {
    return await searchSemanticLegalKnowledge(query, 4);
  }
  return "";
}
