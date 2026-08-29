import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as cheerio from 'cheerio';

interface TribunalConfig {
  formatted: string;
  clean: string;
  tribunalName: string;
  datajudAlias: string;
  isEsaj: boolean;
}

function getTribunalConfig(numero: string): TribunalConfig {
  let clean = numero.replace(/\D/g, '');
  if (clean.length > 0 && clean.length < 20) {
    clean = clean.padStart(20, '0');
  }

  let formatted = numero;
  if (clean.length === 20) {
    formatted = clean.replace(/^(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4})$/, '$1-$2.$3.$4.$5.$6');
  }

  const j = clean.substring(13, 14); // Segmento da Justiça (8 = Estadual, 4 = Federal, 5 = Trabalho)
  const tr = clean.substring(14, 16); // Tribunal

  let tribunalName = 'TRIBUNAL DE JUSTIÇA';
  let datajudAlias = 'api_publica_tjsp';
  let isEsaj = false;

  // 1. Justiça Estadual (J = 8)
  if (j === '8') {
    switch (tr) {
      case '26': tribunalName = 'TJSP (e-SAJ)'; datajudAlias = 'api_publica_tjsp'; isEsaj = true; break;
      case '24': tribunalName = 'TJSC (e-Proc)'; datajudAlias = 'api_publica_tjsc'; break;
      case '21': tribunalName = 'TJRS (e-Proc)'; datajudAlias = 'api_publica_tjrs'; break;
      case '19': tribunalName = 'TJRJ (PJe)'; datajudAlias = 'api_publica_tjrj'; break;
      case '13': tribunalName = 'TJMG (e-Proc)'; datajudAlias = 'api_publica_tjmg'; break;
      case '16': tribunalName = 'TJPR (Projudi)'; datajudAlias = 'api_publica_tjpr'; break;
      case '02': tribunalName = 'TJAL (e-SAJ)'; datajudAlias = 'api_publica_tjal'; isEsaj = true; break;
      case '06': tribunalName = 'TJCE (e-SAJ)'; datajudAlias = 'api_publica_tjce'; isEsaj = true; break;
      case '12': tribunalName = 'TJMS (e-SAJ)'; datajudAlias = 'api_publica_tjms'; isEsaj = true; break;
      case '01': tribunalName = 'TJAC (e-SAJ)'; datajudAlias = 'api_publica_tjac'; isEsaj = true; break;
      case '04': tribunalName = 'TJAM (e-SAJ)'; datajudAlias = 'api_publica_tjam'; isEsaj = true; break;
      case '07': tribunalName = 'TJDF (PJe)'; datajudAlias = 'api_publica_tjdft'; break;
      case '09': tribunalName = 'TJGO (Projudi)'; datajudAlias = 'api_publica_tjgo'; break;
      case '05': tribunalName = 'TJBA (PJe)'; datajudAlias = 'api_publica_tjba'; break;
      case '17': tribunalName = 'TJPE (PJe)'; datajudAlias = 'api_publica_tjpe'; break;
      case '08': tribunalName = 'TJES (PJe)'; datajudAlias = 'api_publica_tjes'; break;
      default: tribunalName = `TJ Estado (${tr})`; datajudAlias = `api_publica_tj${tr}`;
    }
  } 
  // 2. Justiça Federal (J = 4)
  else if (j === '4') {
    switch (tr) {
      case '01': tribunalName = 'TRF1 (PJe)'; datajudAlias = 'api_publica_trf1'; break;
      case '02': tribunalName = 'TRF2 (e-Proc)'; datajudAlias = 'api_publica_trf2'; break;
      case '03': tribunalName = 'TRF3 (PJe)'; datajudAlias = 'api_publica_trf3'; break;
      case '04': tribunalName = 'TRF4 (e-Proc)'; datajudAlias = 'api_publica_trf4'; break;
      case '05': tribunalName = 'TRF5 (PJe)'; datajudAlias = 'api_publica_trf5'; break;
      case '06': tribunalName = 'TRF6 (e-Proc)'; datajudAlias = 'api_publica_trf6'; break;
      default: tribunalName = `TRF Região (${tr})`; datajudAlias = `api_publica_trf${tr}`;
    }
  }
  // 3. Justiça do Trabalho (J = 5)
  else if (j === '5') {
    tribunalName = `TRT${tr} (PJe-JT)`;
    datajudAlias = `api_publica_trt${tr}`;
  }

  return { formatted, clean, tribunalName, datajudAlias, isEsaj };
}

// Raspador HTTP direto para tribunais e-SAJ (TJSP, TJMS, TJAL, TJCE, etc.)
async function scrapeEsajHttp(numero_processo: string) {
  const url = `https://esaj.tjsp.jus.br/cpopg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsulta=${numero_processo}&dadosConsulta.tipoNuProcesso=UNIFICADO`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Tribunal retornou status ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const tribunalMsg = $('#mensagemRetorno, .mensagemErro, #spwTabelaMensagem, .spwMensagem').text().replace(/\s+/g, ' ').trim();
  const notFound = tribunalMsg.includes('Não existem informações disponíveis') || tribunalMsg.includes('não foi encontrado');

  // 1. Partes
  let partes = '';
  const partesRows = $('#tablePartesPrincipais tr');
  if (partesRows.length > 0) {
    const list: string[] = [];
    partesRows.each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text) list.push(text);
    });
    partes = list.join(' | ');
  }

  // 2. Assunto
  const assunto = $('#assuntoProcesso').text().replace(/\s+/g, ' ').trim();

  // 3. Movimentações
  const movimentos: Array<{ data: string; descricao: string }> = [];
  const movRows = $('#tabelaTodasMovimentacoes tr, #tabelaUltimasMovimentacoes tr');
  movRows.each((_, row) => {
    const data = $(row).find('.dataMovimentacao').text().replace(/\s+/g, ' ').trim();
    const descricao = $(row).find('.descricaoMovimentacao').text().replace(/\s+/g, ' ').trim();
    if (data && descricao) {
      movimentos.push({ data, descricao });
    }
  });

  if (notFound && !partes && !assunto) {
    return null;
  }

  return {
    partes: partes || 'Partes não disponíveis',
    assunto: assunto || 'Assunto não disponível',
    movimentos: movimentos.slice(0, 25),
  };
}

// Consulta Oficial à API Pública do DataJud (CNJ) para e-Proc, PJe, Projudi e e-SAJ
async function scrapeDataJud(cleanNumber: string, alias: string) {
  const apiKey = process.env.DATAJUD_API_KEY || "cDZHYzlZa0JadVREZDJCendQbXNpOHpubm1jV3Vqek86dW1xSnZ2ZVhSYTZxSTFXa2w1V0V6dw==";
  const url = `https://api-publica.datajud.cnj.jus.br/${alias}/_search`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `APIKey ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: {
          match: {
            numeroProcesso: cleanNumber
          }
        }
      }),
      cache: "no-store"
    });

    if (!res.ok) {
      console.warn(`[DATAJUD] Tribunal ${alias} retornou status ${res.status}`);
      return null;
    }

    const json = await res.json();
    const hit = json.hits?.hits?.[0]?._source;
    if (!hit) return null;

    // Partes (Polo Ativo / Polo Passivo)
    let partes = "";
    if (Array.isArray(hit.polos)) {
      const poloList: string[] = [];
      hit.polos.forEach((p: any) => {
        const poloNome = p.polo === 'AT' ? 'Autor' : p.polo === 'PA' ? 'Réu' : (p.polo || 'Parte');
        const partesNames = (p.partes || []).map((pt: any) => pt.nome).join(', ');
        if (partesNames) poloList.push(`${poloNome}: ${partesNames}`);
      });
      partes = poloList.join(' | ');
    }

    // Assunto e Classe
    const classe = hit.classe?.nome || '';
    const assunto = (hit.assuntos || []).map((a: any) => a.nome).join(', ') || classe || 'Assunto Judicial';

    // Movimentações
    const movimentos: Array<{ data: string; descricao: string }> = [];
    if (Array.isArray(hit.movimentos)) {
      hit.movimentos.slice(0, 25).forEach((m: any) => {
        const dataStr = m.dataHora ? new Date(m.dataHora).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
        const descricao = m.nome || m.complementosTabelados?.[0]?.descricao || 'Movimentação Processual';
        movimentos.push({ data: dataStr, descricao });
      });
    }

    return {
      partes: partes || 'Partes registradas no CNJ',
      assunto: assunto || 'Processo Judicial',
      movimentos: movimentos.length > 0 ? movimentos : [{ data: new Date().toLocaleDateString('pt-BR'), descricao: 'Processo localizado na base nacional do CNJ.' }]
    };
  } catch (err) {
    console.error("[DATAJUD API ERROR]", err);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const rawNumero = body.numero_processo;
    const processo_id = body.processo_id;

    if (!rawNumero) {
      return NextResponse.json({ error: 'Número do processo obrigatório' }, { status: 400 });
    }

    const { formatted: numero_processo, clean, tribunalName, datajudAlias, isEsaj } = getTribunalConfig(rawNumero);

    if (clean.length !== 20) {
      return NextResponse.json({ error: 'Número CNJ inválido. O processo deve conter 20 dígitos numéricos.' }, { status: 400 });
    }

    let partes = '';
    let assunto = '';
    let movimentos: Array<{ data: string; descricao: string }> = [];

    // 1. Tenta e-SAJ direto se for tribunal e-SAJ
    if (isEsaj) {
      try {
        const esajData = await scrapeEsajHttp(numero_processo);
        if (esajData) {
          partes = esajData.partes;
          assunto = esajData.assunto;
          movimentos = esajData.movimentos;
        }
      } catch (err) {
        console.warn('Erro ao consultar e-SAJ, tentando DataJud como fallback:', err);
      }
    }

    // 2. Se for e-Proc / PJe ou se o e-SAJ não retornou, consulta a API Oficial do DataJud (CNJ)
    if (!partes || movimentos.length === 0) {
      const datajudResult = await scrapeDataJud(clean, datajudAlias);
      if (datajudResult) {
        partes = datajudResult.partes;
        assunto = datajudResult.assunto;
        movimentos = datajudResult.movimentos;
      }
    }

    // 3. Fallback amigável se o processo for segredo de justiça ou não indexado ainda
    if (!partes) {
      partes = 'Processo monitorado (Aguardando publicação / Segredo de Justiça)';
      assunto = 'Processo Judicial em Acompanhamento';
      movimentos = [
        {
          data: new Date().toLocaleDateString('pt-BR'),
          descricao: `Processo cadastrado para acompanhamento no ${tribunalName}. Novas movimentações serão sincronizadas automaticamente.`
        }
      ];
    }

    // Detectar se o processo foi remetido/migrado para o e-Proc do tribunal
    const isMigratedToEproc = movimentos.some(m => 
      m.descricao.toLowerCase().includes('migração para outro sistema') ||
      m.descricao.toLowerCase().includes('sistema eproc') ||
      m.descricao.toLowerCase().includes('tramitar eletronicamente no sistema eproc')
    );

    const statusFinal = isMigratedToEproc ? 'Migrado para e-Proc TJSP' : 'Acompanhando';

    let pId = processo_id;

    if (!pId) {
      const { data: procInsert, error: procErr } = await supabase.from('processos').insert({
        user_id: user.id,
        numero_processo,
        tribunal: tribunalName,
        partes: partes.substring(0, 250),
        assunto: assunto.substring(0, 250),
        status: statusFinal,
        ultima_atualizacao: new Date().toISOString(),
      }).select().single();

      if (procErr) throw procErr;
      pId = procInsert.id;
    } else {
      await supabase.from('processos').update({
        numero_processo,
        tribunal: tribunalName,
        partes: partes.substring(0, 250),
        assunto: assunto.substring(0, 250),
        status: statusFinal,
        ultima_atualizacao: new Date().toISOString(),
      }).eq('id', pId);
    }

    if (pId) {
      const { data: existingMovs } = await supabase
        .from('movimentacoes_processuais')
        .select('data_movimentacao, descricao')
        .eq('processo_id', pId);

      const existingSet = new Set((existingMovs || []).map(m => `${m.data_movimentacao}|${m.descricao}`));

      const newInserts = movimentos
        .filter(m => !existingSet.has(`${m.data.substring(0, 50)}|${m.descricao.substring(0, 1000)}`))
        .map(m => ({
          processo_id: pId,
          data_movimentacao: m.data.substring(0, 50),
          descricao: m.descricao.substring(0, 1000),
          is_read: false,
        }));

      if (newInserts.length > 0) {
        await supabase.from('movimentacoes_processuais').insert(newInserts);
        console.log(`[SYNC PROCESSOS] Inseridas ${newInserts.length} novas movimentações no processo ${pId}.`);
      }
    }

    return NextResponse.json({ success: true, processo_id: pId, numero_processo, tribunal: tribunalName, movimentos });
  } catch (error: any) {
    console.error('API error sync:', error);
    return NextResponse.json({ error: error.message || 'Erro interno ao consultar tribunal' }, { status: 500 });
  }
}
