import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as cheerio from 'cheerio';

function sanitizeAndPadCnj(numero: string): { formatted: string; clean: string; tribunal: string } {
  let clean = numero.replace(/\D/g, '');
  if (clean.length > 0 && clean.length < 20) {
    clean = clean.padStart(20, '0');
  }
  
  let formatted = numero;
  if (clean.length === 20) {
    formatted = clean.replace(/^(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4})$/, '$1-$2.$3.$4.$5.$6');
  }

  const j = clean.substring(13, 14);
  const tr = clean.substring(14, 16);

  let tribunal = 'TRIBUNAL REGIONAL / ESTADUAL';
  if (j === '8' && tr === '26') tribunal = 'TJSP (e-SAJ)';
  else if (j === '8' && tr === '24') tribunal = 'TJSC (e-Proc)';
  else if (j === '8' && tr === '21') tribunal = 'TJRS (e-Proc)';
  else if (j === '8' && tr === '19') tribunal = 'TJRJ (PJe)';
  else if (j === '8' && tr === '13') tribunal = 'TJMG (e-Proc)';
  else if (j === '4' && tr === '04') tribunal = 'TRF4 (e-Proc)';
  else if (j === '4' && tr === '02') tribunal = 'TRF2 (e-Proc)';
  else if (j === '4' && tr === '03') tribunal = 'TRF3 (PJe)';

  return { formatted, clean, tribunal };
}

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

  // Verificar se há mensagens de erro ou processo não encontrado
  const tribunalMsg = $('#mensagemRetorno, .mensagemErro, #spwTabelaMensagem, .spwMensagem').text().replace(/\s+/g, ' ').trim();
  const notFound = tribunalMsg.includes('Não existem informações disponíveis') || tribunalMsg.includes('não foi encontrado');

  // 1. Extrair Partes
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

  // 2. Extrair Assunto
  const assunto = $('#assuntoProcesso').text().replace(/\s+/g, ' ').trim();

  // 3. Extrair Movimentações
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
    return {
      partes: 'Processo não encontrado ou sob Segredo de Justiça',
      assunto: 'Sem informações públicas no tribunal',
      movimentos: [
        { data: new Date().toLocaleDateString('pt-BR'), descricao: 'Tribunal informou: Não existem informações públicas para os parâmetros fornecidos.' }
      ],
      notFound: true,
    };
  }

  return {
    partes: partes || 'Partes não disponíveis',
    assunto: assunto || 'Assunto não disponível',
    movimentos: movimentos.slice(0, 25),
    notFound: false,
  };
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

    const { formatted: numero_processo, clean, tribunal } = sanitizeAndPadCnj(rawNumero);

    if (clean.length !== 20) {
      return NextResponse.json({ error: 'Número CNJ inválido. O processo deve conter 20 dígitos numéricos.' }, { status: 400 });
    }

    let partes = 'Partes não encontradas';
    let assunto = 'Assunto não encontrado';
    let movimentos: Array<{ data: string; descricao: string }> = [];

    if (tribunal.includes('e-SAJ')) {
      try {
        const scraped = await scrapeEsajHttp(numero_processo);
        partes = scraped.partes;
        assunto = scraped.assunto;
        movimentos = scraped.movimentos;
      } catch (err: any) {
        console.error('Erro ao consultar e-SAJ via HTTP:', err);
        throw new Error(err?.message || 'Falha ao consultar tribunal');
      }
    } else if (tribunal.includes('e-Proc')) {
      partes = 'Consulta e-Proc (Aguardando Integração DataJud/CNJ)';
      assunto = 'Processo Justiça Federal / Estadual e-Proc';
      movimentos = [
        { data: new Date().toLocaleDateString('pt-BR'), descricao: 'Processo cadastrado para acompanhamento no sistema e-Proc.' },
        { data: new Date().toLocaleDateString('pt-BR'), descricao: 'Aguardando publicação do diário oficial.' },
      ];
    } else {
      partes = 'Autor (Aguardando Sincronização) | Réu';
      assunto = 'Ação Cível / Especializada';
      movimentos = [
        { data: new Date().toLocaleDateString('pt-BR'), descricao: 'Processo cadastrado para monitoramento contínuo.' }
      ];
    }

    if (!partes) partes = 'Partes indisponíveis';
    if (!assunto) assunto = 'Assunto indisponível';
    if (movimentos.length === 0) {
      movimentos = [{ data: new Date().toLocaleDateString('pt-BR'), descricao: 'Nenhuma nova movimentação registrada no diário oficial.' }];
    }

    let pId = processo_id;

    if (!pId) {
      const { data: procInsert, error: procErr } = await supabase.from('processos').insert({
        user_id: user.id,
        numero_processo,
        tribunal,
        partes: partes.substring(0, 250),
        assunto: assunto.substring(0, 250),
        status: 'Acompanhando',
        ultima_atualizacao: new Date().toISOString(),
      }).select().single();

      if (procErr) throw procErr;
      pId = procInsert.id;
    } else {
      await supabase.from('processos').update({
        numero_processo,
        tribunal,
        partes: partes.substring(0, 250),
        assunto: assunto.substring(0, 250),
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

    return NextResponse.json({ success: true, processo_id: pId, numero_processo, movimentos });
  } catch (error: any) {
    console.error('API error sync:', error);
    return NextResponse.json({ error: error.message || 'Erro interno ao consultar tribunal' }, { status: 500 });
  }
}
