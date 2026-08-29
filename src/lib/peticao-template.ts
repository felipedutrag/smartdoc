export interface PeticaoDocumentJson {
  titulo?: string;
  resumo?: string;
  cabecalho: {
    enderecamento: string;
  };
  partes: {
    autor: {
      nome: string;
      qualificacao: string;
    };
    tipoAcao: string;
    reu: {
      nome: string;
      qualificacao: string;
    };
  };
  fatos: string[];
  direito: Array<{
    subtitulo?: string;
    paragrafos: string[];
    citacaoDestaque?: string;
  }>;
  pedidos: Array<{
    alinea: string;
    texto: string;
  }>;
  fechamento: {
    provas?: string;
    valorCausa?: string;
    localData?: string;
    advogado?: {
      nome?: string;
      oab?: string;
    };
  };
}

/**
 * Retorna os blocos HTML sequenciais da petição para permitir renderização progressiva / typewriter
 */
export function getPeticaoBlocks(data: PeticaoDocumentJson): string[] {
  if (!data) return [];

  const {
    cabecalho,
    partes,
    fatos = [],
    direito = [],
    pedidos = [],
    fechamento,
  } = data;

  const blocks: string[] = [];

  // 1. Endereçamento (Juízo)
  if (cabecalho?.enderecamento) {
    blocks.push(
      `<p style="text-align: justify; line-height: 1.5; margin-bottom: 3.5rem;"><strong>${cabecalho.enderecamento}</strong></p>`
    );
  }

  // 2. Preâmbulo / Qualificação das Partes
  const autorNome = partes?.autor?.nome || "[NOME DO AUTOR]";
  const autorQualif = partes?.autor?.qualificacao || "[nacionalidade], [estado civil], [profissão], inscrito no CPF nº [Número], residente em [Endereço]";
  const tipoAcao = partes?.tipoAcao || "AÇÃO JUDICIAL";
  const reuNome = partes?.reu?.nome || "[NOME DO RÉU]";
  const reuQualif = partes?.reu?.qualificacao || "[nacionalidade/tipo], inscrito no CPF/CNPJ nº [Número], com endereço em [Endereço]";

  blocks.push(
    `<p style="text-align: justify; margin-top: 0;"><strong>${autorNome}</strong>, ${autorQualif}, por seu advogado que esta subscreve, vem, mui respeitosamente, perante Vossa Excelência, propor a presente</p>`
  );

  blocks.push(
    `<h2 style="text-align: center; text-transform: uppercase; margin: 2rem 0; font-family: inherit;">${tipoAcao}</h2>`
  );

  blocks.push(
    `<p style="text-align: justify; margin-bottom: 1.25rem;">em face de <strong>${reuNome}</strong>, ${reuQualif}, pelos fatos e fundamentos jurídicos que passa a expor:</p>`
  );

  blocks.push("<hr/>");

  // 3. Dos Fatos
  blocks.push(`<h2 style="text-align: left;">I. DOS FATOS</h2>`);
  if (Array.isArray(fatos) && fatos.length > 0) {
    for (const fato of fatos) {
      if (fato?.trim()) {
        blocks.push(`<p style="text-align: justify;">${fato.trim()}</p>`);
      }
    }
  } else {
    blocks.push(`<p style="text-align: justify;">[Narra-se os fatos que deram origem à demanda]</p>`);
  }

  blocks.push("<hr/>");

  // 4. Do Direito
  blocks.push(`<h2 style="text-align: left;">II. DO DIREITO</h2>`);
  if (Array.isArray(direito) && direito.length > 0) {
    for (const item of direito) {
      if (item.subtitulo?.trim()) {
        blocks.push(`<p style="text-align: justify; font-weight: bold; margin-top: 1rem;">${item.subtitulo.trim()}</p>`);
      }
      if (Array.isArray(item.paragrafos)) {
        for (const p of item.paragrafos) {
          if (p?.trim()) {
            blocks.push(`<p style="text-align: justify;">${p.trim()}</p>`);
          }
        }
      }
      if (item.citacaoDestaque?.trim()) {
        blocks.push(
          `<blockquote style="text-align: justify;">${item.citacaoDestaque.trim()}</blockquote>`
        );
      }
    }
  }

  blocks.push("<hr/>");

  // 5. Dos Pedidos
  blocks.push(`<h2 style="text-align: left;">III. DOS PEDIDOS</h2>`);
  blocks.push(`<p style="text-align: justify;">Ante o exposto, requer a Vossa Excelência:</p>`);

  if (Array.isArray(pedidos) && pedidos.length > 0) {
    for (const ped of pedidos) {
      const alinea = ped.alinea ? `${ped.alinea})` : "•";
      blocks.push(
        `<p style="text-align: justify;"><strong>${alinea}</strong> ${ped.texto?.trim() || ""}</p>`
      );
    }
  }

  // Protesto por provas e Valor da Causa dentro dos pedidos
  if (fechamento?.provas?.trim()) {
    blocks.push(`<p style="text-align: justify; margin-top: 1rem;">${fechamento.provas.trim()}</p>`);
  } else {
    blocks.push(
      `<p style="text-align: justify; margin-top: 1rem;">Protesta provar o alegado por todos os meios de prova em direito admitidos, especialmente documental, testemunhal e pericial.</p>`
    );
  }

  let valorCausa = fechamento?.valorCausa?.trim() || "R$ [Valor da Causa]";
  // Remove prefixos redundantes caso a IA já tenha retornado "Dá-se à causa o valor de..."
  valorCausa = valorCausa.replace(/^d[aá]-se\s+[aà]\s+causa\s+o\s+valor\s+de\s+/i, "").replace(/^d[aá]-se\s+o\s+valor\s+de\s+/i, "").trim();
  if (!valorCausa.endsWith(".")) valorCausa += ".";

  blocks.push(
    `<p style="text-align: justify; font-weight: 500;">Dá-se à causa o valor de ${valorCausa}</p>`
  );

  blocks.push("<br/>");

  // 6. Fechamento e Assinatura
  const localData = fechamento?.localData?.trim() || "[Local], [Data]";
  const advNome = fechamento?.advogado?.nome?.trim() || "[Nome do Advogado]";
  const advOab = fechamento?.advogado?.oab?.trim() || "OAB/[UF] [Número]";

  blocks.push(
    `<p style="text-align: center; margin-bottom: 0.5rem;">Nestes termos,<br/>Pede deferimento.</p>`
  );
  blocks.push(
    `<p style="text-align: center; margin-bottom: 2rem;">${localData}.</p>`
  );
  blocks.push(
    `<p style="text-align: center; margin-bottom: 0.25rem;">_________________________________________</p>`
  );
  blocks.push(
    `<p style="text-align: center; font-weight: bold; margin-bottom: 0.25rem;">${advNome}</p>`
  );
  blocks.push(
    `<p style="text-align: center; color: var(--text-secondary);">${advOab}</p>`
  );

  return blocks;
}

/**
 * Converte o JSON estruturado gerado pela IA em HTML padronizado com Visual Law e regras formais
 */
export function renderPeticaoJsonToHtml(data: PeticaoDocumentJson): string {
  return getPeticaoBlocks(data).join("\n");
}
