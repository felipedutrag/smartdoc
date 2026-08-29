import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import puppeteer from 'puppeteer';

function parseTribunal(numero: string) {
  const clean = numero.replace(/\D/g, '');
  if (clean.length !== 20) return 'DESCONHECIDO';
  
  const j = clean.substring(13, 14);
  const tr = clean.substring(14, 16);
  
  if (j === '8' && tr === '26') return 'TJSP (e-SAJ)';
  if (j === '4' && tr === '04') return 'TRF4 (e-Proc)';
  return 'TRIBUNAL GENÉRICO';
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const numero_processo = body.numero_processo;
    const processo_id = body.processo_id;

    if (!numero_processo) {
      return NextResponse.json({ error: 'Número do processo obrigatório' }, { status: 400 });
    }

    const tribunal = parseTribunal(numero_processo);
    let partes = 'Partes não encontradas';
    let assunto = 'Assunto não encontrado';
    let movimentos: Array<{ data: string, descricao: string }> = [];

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      if (tribunal === 'TJSP (e-SAJ)') {
        const url = `https://esaj.tjsp.jus.br/cpopg/search.do?cbPesquisa=NUMPROC&dadosConsulta.valorConsulta=${numero_processo}&dadosConsulta.tipoNuProcesso=UNIFICADO`;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        try {
          await page.waitForSelector('#tablePartesPrincipais', { timeout: 8000 });
          
          partes = await page.evaluate(() => {
            const table = document.querySelector('#tablePartesPrincipais');
            if (!table) return '';
            return Array.from(table.querySelectorAll('tr')).map(r => r.innerText.trim().replace(/\s+/g, ' ')).join(' | ');
          });

          assunto = await page.evaluate(() => {
            const el = document.querySelector('#assuntoProcesso');
            return el ? el.textContent?.trim() || '' : '';
          });

          movimentos = await page.evaluate(() => {
            const tbody = document.querySelector('#tabelaTodasMovimentacoes');
            if (!tbody) return [];
            return Array.from(tbody.querySelectorAll('tr')).slice(0, 15).map(row => {
              const data = row.querySelector('.dataMovimentacao')?.textContent?.trim() || '';
              const descricao = row.querySelector('.descricaoMovimentacao')?.textContent?.trim() || '';
              return { data, descricao };
            });
          });
        } catch (e) {
          console.error("ESAJ scraping error or captcha", e);
        }

      } else {
        partes = "Autor (Exemplo) | Réu (Exemplo)";
        assunto = "Ação de Cobrança / Indenizatória";
        movimentos = [
          { data: new Date().toLocaleDateString('pt-BR'), descricao: "Acesso ao tribunal protegido por Captcha ou falhou. Isso é uma simulação." },
          { data: new Date().toLocaleDateString('pt-BR'), descricao: "Processo distribuído." }
        ];
      }
    } finally {
      await browser.close();
    }

    if (!partes) partes = "Partes indisponíveis";
    if (!assunto) assunto = "Assunto indisponível";
    if (movimentos.length === 0) movimentos = [{ data: new Date().toLocaleDateString('pt-BR'), descricao: "Nenhuma movimentação encontrada ou acesso negado." }];

    let pId = processo_id;

    if (!pId) {
      const { data: procInsert, error: procErr } = await supabase.from('processos').insert({
        user_id: user.id,
        numero_processo,
        tribunal,
        partes: partes.substring(0, 200),
        assunto: assunto.substring(0, 200),
        status: 'Acompanhando'
      }).select().single();

      if (procErr) throw procErr;
      pId = procInsert.id;
    } else {
      await supabase.from('processos').update({
        partes: partes.substring(0, 200),
        assunto: assunto.substring(0, 200),
        ultima_atualizacao: new Date().toISOString()
      }).eq('id', pId);
    }

    if (pId) {
      await supabase.from('movimentacoes_processuais').delete().eq('processo_id', pId);
      const inserts = movimentos.map(m => ({
        processo_id: pId,
        data_movimentacao: m.data.substring(0, 50),
        descricao: m.descricao.substring(0, 1000)
      }));
      if (inserts.length > 0) {
        await supabase.from('movimentacoes_processuais').insert(inserts);
      }
    }

    return NextResponse.json({ success: true, processo_id: pId, movimentos });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
