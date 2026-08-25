import fs from "fs";
import path from "path";

/**
 * Carrega e sintetiza todas as bases de conhecimento forenses cadastradas em src/knowledge/
 */
export function getLegalKnowledgeBase(): string {
  try {
    const knowledgeDir = path.join(process.cwd(), "src", "knowledge");
    if (!fs.existsSync(knowledgeDir)) {
      return "";
    }

    const files = fs.readdirSync(knowledgeDir).filter(f => f.endsWith(".md") || f.endsWith(".json") || f.endsWith(".csv"));
    if (files.length === 0) return "";

    let fullKnowledge = "\n=== COMPÊNDIO OFICIAL DE JURISPRUDÊNCIA E PRECEDENTES VINCULANTES (STF/STJ) ===\n";

    for (const file of files) {
      const filePath = path.join(knowledgeDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      fullKnowledge += `\n--- FONTE: ${file} ---\n${content}\n`;
    }

    return fullKnowledge;
  } catch (error) {
    console.error("[KnowledgeBase] Erro ao carregar base de conhecimento:", error);
    return "";
  }
}
