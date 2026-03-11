import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { verificarAtraso } from '../utils/calculoDiasUteis';
import { differenceInDays, parseISO } from 'date-fns';

export interface FiltrosType {
  periodo: { inicio: string; fim: string };
  status: string[];
  responsaveis: string[];
  tipo: 'todos' | 'solicitacoes' | 'demandas';
  usuario: 'proprios' | 'todos';
}

export interface RelatorioItem {
  id: string;
  protocolo: string;
  tipo: 'solicitacao' | 'demanda';
  assunto: string;
  status: string;
  data_inicio: string | null;
  data_contato: string | null;
  data_finalizado: string | null;
  observacoes: string;
  responsavel: string;
  ponto_contato: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  // Campos calculados
  usuario_criador: string;
  email_criador: string;
  role_criador: string;
  dias_em_aberto: number;
  dias_uteis: number;
  tempo_atendimento: number;
  status_atraso: boolean;
  dias_atraso: number;
}

export const useRelatoriosData = (filtros: FiltrosType) => {
  const [dados, setDados] = useState<RelatorioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    carregarDados();
  }, [filtros]);

  const carregarDados = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('solicitacoes')
        .select(`
          *,
          profiles!inner (
            full_name,
            email,
            role
          )
        `);

      // Aplicar filtros
      query = aplicarFiltros(query, filtros);

      const { data: solicitacoesData, error: solicitacoesError } = await query;

      if (solicitacoesError) throw solicitacoesError;

      // Buscar demandas se necessário
      let demandasData = [];
      if (filtros.tipo === 'todos' || filtros.tipo === 'demandas') {
        let demandasQuery = supabase
          .from('demandas')
          .select(`
            *,
            profiles!inner (
              full_name,
              email,
              role
            )
          `);

        demandasQuery = aplicarFiltros(demandasQuery, filtros);

        const { data: demandasResult, error: demandasError } = await demandasQuery;

        if (demandasError) throw demandasError;
        demandasData = demandasResult || [];
      }

      // Combinar e processar dados
      const todosDados = [
        ...(solicitacoesData || []).map(item => ({ ...item, tipo: 'solicitacao' as const })),
        ...(demandasData || []).map(item => ({ ...item, tipo: 'demanda' as const })),
      ];

      const dadosProcessados = todosDados.map(processarItem);
      setDados(dadosProcessados);

    } catch (err) {
      console.error('Erro ao carregar dados dos relatórios:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  return {
    dados,
    loading,
    error,
    recarregar: carregarDados,
  };
};

const aplicarFiltros = (query: any, filtros: FiltrosType) => {
  // Filtro de período
  if (filtros.periodo.inicio) {
    query = query.gte('created_at', filtros.periodo.inicio);
  }
  if (filtros.periodo.fim) {
    query = query.lte('created_at', filtros.periodo.fim);
  }

  // Filtro de status
  if (filtros.status.length > 0) {
    query = query.in('status', filtros.status);
  }

  // Filtro de responsáveis
  if (filtros.responsaveis.length > 0) {
    query = query.in('responsavel', filtros.responsaveis);
  }

  // Filtro de usuário (apenas para não-admins)
  if (filtros.usuario === 'proprios') {
    // O RLS já filtra pelo usuário atual
  }

  return query.order('created_at', { ascending: false });
};

const processarItem = (item: any): RelatorioItem => {
  const agora = new Date();
  const dataCriacao = parseISO(item.created_at);
  const dataInicio = item.data_inicio ? parseISO(item.data_inicio) : null;
  const dataContato = item.data_contato ? parseISO(item.data_contato) : null;
  const dataFinalizado = item.data_finalizado ? parseISO(item.data_finalizado) : null;

  // Calcular métricas
  const diasEmAberto = differenceInDays(agora, dataCriacao);
  const diasUteis = calcularDiasUteis(dataCriacao, agora);
  const tempoAtendimento = dataFinalizado ? differenceInDays(dataFinalizado, dataInicio || dataCriacao) : 0;
  const statusAtraso = verificarAtraso(item.status, item.data_contato);
  const diasAtraso = statusAtraso && dataContato ? differenceInDays(agora, dataContato) : 0;

  return {
    id: item.id,
    protocolo: item.protocolo,
    tipo: item.tipo,
    assunto: item.assunto,
    status: item.status,
    data_inicio: item.data_inicio,
    data_contato: item.data_contato,
    data_finalizado: item.data_finalizado,
    observacoes: item.observacoes,
    responsavel: item.responsavel,
    ponto_contato: item.ponto_contato,
    user_id: item.user_id,
    created_at: item.created_at,
    updated_at: item.updated_at,
    usuario_criador: item.profiles?.full_name || '',
    email_criador: item.profiles?.email || '',
    role_criador: item.profiles?.role || '',
    dias_em_aberto: diasEmAberto,
    dias_uteis: diasUteis,
    tempo_atendimento: tempoAtendimento,
    status_atraso: statusAtraso,
    dias_atraso: diasAtraso,
  };
};

// Função simplificada para calcular dias úteis (aproximação)
const calcularDiasUteis = (dataInicio: Date, dataFim: Date): number => {
  let diasUteis = 0;
  let dataAtual = new Date(dataInicio);

  while (dataAtual <= dataFim) {
    const diaSemana = dataAtual.getDay();
    // Considera dias úteis (segunda a sexta)
    if (diaSemana >= 1 && diaSemana <= 5) {
      diasUteis++;
    }
    dataAtual.setDate(dataAtual.getDate() + 1);
  }

  return diasUteis;
};

export const getResponsaveisDisponiveis = async (): Promise<string[]> => {
  try {
    const { data: solicitacoes } = await supabase
      .from('solicitacoes')
      .select('responsavel')
      .not('responsavel', 'is', null);

    const { data: demandas } = await supabase
      .from('demandas')
      .select('responsavel')
      .not('responsavel', 'is', null);

    const todosResponsaveis = [
      ...(solicitacoes || []).map(s => s.responsavel),
      ...(demandas || []).map(d => d.responsavel),
    ];

    // Remover duplicados e ordenar
    return Array.from(new Set(todosResponsaveis.filter(Boolean))).sort();
  } catch (error) {
    console.error('Erro ao buscar responsáveis:', error);
    return [];
  }
};
