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

  // 1. Endereçamento (Juízo) - Espaçamento forense padrão abaixo do juízo
  if (cabecalho?.enderecamento) {
    blocks.push(
      `<p style="text-align: justify; line-height: 1.5; margin-bottom: 3.5rem;"><strong>${cabecalho.enderecamento}</strong></p>`
    );
  }

  // 2. Preâmbulo / Qualificação das Partes
  const autorNome = partes?.autor?.nome || "[NOME DO AUTOR]";
  const autorQualif = partes?.autor?.qualificacao || "[nacionalidade], [estado civil], [profissão], inscrito no CPF nº [Número], residente em [Endereço]";

  // Garantir captura do tipo de ação mesmo se a IA aninhar fora de partes ou com outro nome
  const tipoAcao = (
    partes?.tipoAcao ||
    (partes as any)?.tipo_acao ||
    (data as any)?.tipoAcao ||
    (data as any)?.tipo_acao ||
    data?.titulo ||
    "AÇÃO JUDICIAL"
  ).trim();

  const reuNome = partes?.reu?.nome || "[NOME DO RÉU]";
  const reuQualif = partes?.reu?.qualificacao || "[nacionalidade/tipo], inscrito no CPF/CNPJ nº [Número], com endereço em [Endereço]";

  // Autor
  blocks.push(
    `<p style="text-align: justify;"><strong>${autorNome}</strong>, ${autorQualif}, por seu advogado que esta subscreve, vem, mui respeitosamente, perante Vossa Excelência, propor a presente</p>`
  );

  // Linha pulada antes do nome da ação (editável)
  blocks.push(`<p><br></p>`);

  // Nome da Ação (Centralizado sem qualquer margem top ou bottom)
  blocks.push(
    `<h2 style="text-align: center; text-transform: uppercase; margin: 0; margin-top: 0; margin-bottom: 0;">${tipoAcao}</h2>`
  );

  // Linha pulada após o nome da ação (editável)
  blocks.push(`<p><br></p>`);

  // Réu
  blocks.push(
    `<p style="text-align: justify;">em face de <strong>${reuNome}</strong>, ${reuQualif}, pelos fatos e fundamentos jurídicos que passa a expor:</p>`
  );

  // Linha pulada antes dos fatos (editável)
  blocks.push(`<p><br></p>`);

  // 3. Dos Fatos
  blocks.push(`<h2 style="text-align: left;">I. DOS FATOS</h2>`);
  blocks.push(`<p><br></p>`);

  if (Array.isArray(fatos) && fatos.length > 0) {
    for (let i = 0; i < fatos.length; i++) {
      const fato = fatos[i];
      if (fato?.trim()) {
        if (i > 0) blocks.push(`<p><br></p>`);
        blocks.push(`<p style="text-align: justify;">${fato.trim()}</p>`);
      }
    }
  } else {
    blocks.push(`<p style="text-align: justify;">[Narra-se os fatos que deram origem à demanda]</p>`);
  }

  // Linha pulada antes do Direito
  blocks.push(`<p><br></p>`);

  // 4. Do Direito
  blocks.push(`<h2 style="text-align: left;">II. DO DIREITO</h2>`);

  if (Array.isArray(direito) && direito.length > 0) {
    for (const item of direito) {
      if (item.subtitulo?.trim()) {
        blocks.push(`<p><br></p>`);
        blocks.push(`<p style="text-align: justify; font-weight: bold;">${item.subtitulo.trim()}</p>`);
      }
      if (Array.isArray(item.paragrafos)) {
        for (const p of item.paragrafos) {
          if (p?.trim()) {
            blocks.push(`<p><br></p>`);
            blocks.push(`<p style="text-align: justify;">${p.trim()}</p>`);
          }
        }
      }
      if (item.citacaoDestaque?.trim()) {
        blocks.push(`<p><br></p>`);
        blocks.push(
          `<blockquote style="text-align: justify;">${item.citacaoDestaque.trim()}</blockquote>`
        );
      }
    }
  }

  // Linha pulada antes dos Pedidos
  blocks.push(`<p><br></p>`);

  // 5. Dos Pedidos
  blocks.push(`<h2 style="text-align: left;">III. DOS PEDIDOS</h2>`);
  blocks.push(`<p><br></p>`);
  blocks.push(`<p style="text-align: justify;">Ante o exposto, requer a Vossa Excelência:</p>`);
  blocks.push(`<p><br></p>`);

  if (Array.isArray(pedidos) && pedidos.length > 0) {
    for (let i = 0; i < pedidos.length; i++) {
      const ped = pedidos[i];
      const alinea = ped.alinea ? `${ped.alinea})` : "•";
      if (i > 0) blocks.push(`<p><br></p>`);
      blocks.push(
        `<p style="text-align: justify;"><strong>${alinea}</strong> ${ped.texto?.trim() || ""}</p>`
      );
    }
  }

  // Protesto por provas e Valor da Causa
  blocks.push(`<p><br></p>`);
  if (fechamento?.provas?.trim()) {
    blocks.push(`<p style="text-align: justify;">${fechamento.provas.trim()}</p>`);
  } else {
    blocks.push(
      `<p style="text-align: justify;">Protesta provar o alegado por todos os meios de prova em direito admitidos, especialmente documental, testemunhal e pericial.</p>`
    );
  }

  let valorCausa = fechamento?.valorCausa?.trim() || "R$ [Valor da Causa]";
  valorCausa = valorCausa.replace(/^d[aá]-se\s+[aà]\s+causa\s+o\s+valor\s+de\s+/i, "").replace(/^d[aá]-se\s+o\s+valor\s+de\s+/i, "").trim();
  if (!valorCausa.endsWith(".")) valorCausa += ".";

  blocks.push(`<p><br></p>`);
  blocks.push(
    `<p style="text-align: justify; font-weight: bold;">Dá-se à causa o valor de ${valorCausa}</p>`
  );

  // 6. Fechamento e Assinatura
  const localData = fechamento?.localData?.trim() || "[Local], [Data]";
  const advNome = fechamento?.advogado?.nome?.trim() || "[Nome do Advogado]";
  const advOab = fechamento?.advogado?.oab?.trim() || "OAB/[UF] [Número]";

  blocks.push(`<p><br></p>`);
  blocks.push(
    `<p style="text-align: center;">Nestes termos,<br/>Pede deferimento.</p>`
  );
  blocks.push(`<p><br></p>`);
  blocks.push(
    `<p style="text-align: center;">${localData}.</p>`
  );
  blocks.push(`<p><br></p>`);
  blocks.push(
    `<p style="text-align: center;">_________________________________________</p>`
  );
  blocks.push(
    `<p style="text-align: center; font-weight: bold;">${advNome}</p>`
  );
  blocks.push(
    `<p style="text-align: center; color: var(--text-secondary);">${advOab}</p>`
  );

  return blocks;
}

export function renderPeticaoJsonToHtml(data: PeticaoDocumentJson): string {
  return getPeticaoBlocks(data).join("\n");
}
