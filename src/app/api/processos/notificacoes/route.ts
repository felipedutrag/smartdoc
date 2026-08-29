import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/processos/notificacoes - Retorna as últimas movimentações processuais do usuário
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 1. Busca os IDs dos processos do usuário
    const { data: userProcesses, error: procError } = await supabase
      .from('processos')
      .select('id, numero_processo, tribunal, partes, assunto')
      .eq('user_id', user.id);

    if (procError || !userProcesses || userProcesses.length === 0) {
      return NextResponse.json({ notifications: [] });
    }

    const processMap = new Map(userProcesses.map((p) => [p.id, p]));
    const processIds = userProcesses.map((p) => p.id);

    // 2. Busca apenas as movimentações não lidas (pendentes) vinculadas aos processos do usuário
    const { data: movements, error: movError } = await supabase
      .from('movimentacoes_processuais')
      .select('id, processo_id, data_movimentacao, descricao, is_read, created_at')
      .in('processo_id', processIds)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(30);

    if (movError) {
      console.error('Erro ao buscar movimentações:', movError);
      return NextResponse.json({ error: movError.message }, { status: 500 });
    }

    const notifications = (movements || []).map((m) => {
      const proc = processMap.get(m.processo_id);
      return {
        id: m.id,
        processo_id: m.processo_id,
        numero_processo: proc?.numero_processo || 'Processo Judicial',
        tribunal: proc?.tribunal || 'Tribunal',
        title: `Proc. ${proc?.numero_processo || 'Judicial'}`,
        description: m.descricao,
        time: m.data_movimentacao || (m.created_at ? new Date(m.created_at).toLocaleDateString('pt-BR') : 'Hoje'),
        read: Boolean(m.is_read),
        created_at: m.created_at,
      };
    });

    return NextResponse.json({ notifications });
  } catch (err: any) {
    console.error('Erro na rota de notificações:', err);
    return NextResponse.json({ error: err?.message || 'Erro interno' }, { status: 500 });
  }
}

// PATCH /api/processos/notificacoes - Marca movimentações como lidas
export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { notification_id, mark_all } = body;

    // Busca os IDs dos processos do usuário para segurança
    const { data: userProcesses } = await supabase
      .from('processos')
      .select('id')
      .eq('user_id', user.id);

    const processIds = (userProcesses || []).map((p) => p.id);
    if (processIds.length === 0) {
      return NextResponse.json({ success: true });
    }

    if (notification_id) {
      // Marca uma específica como lida
      await supabase
        .from('movimentacoes_processuais')
        .update({ is_read: true })
        .eq('id', notification_id)
        .in('processo_id', processIds);
    } else if (mark_all) {
      // Marca todas as movimentações dos processos do usuário como lidas
      await supabase
        .from('movimentacoes_processuais')
        .update({ is_read: true })
        .in('processo_id', processIds);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Erro ao atualizar status de leitura:', err);
    return NextResponse.json({ error: err?.message || 'Erro interno' }, { status: 500 });
  }
}
