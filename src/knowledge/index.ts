import fs from "fs";
import path from "path";

export interface KnowledgeMatch {
  source: string;
  topic: string;
  content: string;
  score: number;
}

/**
 * Busca inteligente e direcionada na base de jurisprudência/súmulas
 * Retorna apenas as seções e teses altamente relevantes para o caso concreto (economizando tokens).
 */
export function searchLegalKnowledge(queryOrFacts: string, maxResults: number = 3): string {
  try {
    const knowledgeDir = path.join(process.cwd(), "src", "knowledge");
    if (!fs.existsSync(knowledgeDir)) return "";

    const files = fs.readdirSync(knowledgeDir).filter(f => f.endsWith(".md"));
    if (files.length === 0) return "";

    // Palavras-chave extraídas da query/fatos (ignorando stopwords comuns)
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

      // Divide o arquivo em tópicos ou itens individuais (- **Item:**)
      const sections = content.split(/(?=\n- \*\*|\n## )/g);

      for (const section of sections) {
        const trimmed = section.trim();
        if (trimmed.length < 30) continue;

        const lowerSection = trimmed.toLowerCase();
        let score = 0;

        for (const word of words) {
          if (lowerSection.includes(word)) {
            score += 1;
            // Bônus se a palavra aparecer no título/tema
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

    // Ordena por relevância e pega os melhores resultados
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
 * Retorna os tópicos e precedentes específicos para o caso ou vazio se não houver correlação
 */
export function getLegalKnowledgeBase(query?: string): string {
  if (query && query.trim().length > 0) {
    return searchLegalKnowledge(query, 3);
  }
  return "";
}
