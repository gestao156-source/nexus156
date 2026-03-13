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

    console.log('🔍 Iniciando carregamento de dados com filtros:', JSON.stringify(filtros, null, 2));

    try {
      // Buscar solicitações se necessário
      let solicitacoesData = [];
      if (filtros.tipo === 'todos' || filtros.tipo === 'solicitacoes') {
        console.log('📋 Buscando solicitações - tipo permitido:', filtros.tipo);
        
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
        console.log('📋 Query de solicitacoes com filtros aplicados');

        console.log('📋 Executando query de solicitacoes...');
        const { data: solicitacoesResult, error: solicitacoesError } = await query;

        if (solicitacoesError) {
          console.error('❌ Erro nas solicitacoes:', solicitacoesError);
          throw solicitacoesError;
        }
        solicitacoesData = solicitacoesResult || [];
        console.log('✅ Solicitações encontradas:', solicitacoesData.length);
      } else {
        console.log('📋 Pulando solicitações - filtro tipo:', filtros.tipo);
      }

      // Buscar demandas se necessário
      let demandasData = [];
      if (filtros.tipo === 'todos' || filtros.tipo === 'demandas') {
        console.log('📋 Buscando demandas - tipo permitido:', filtros.tipo);
        
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
        console.log('📋 Query de demandas com filtros aplicados');

        console.log('📋 Executando query de demandas...');
        const { data: demandasResult, error: demandasError } = await demandasQuery;

        if (demandasError) {
          console.error('❌ Erro nas demandas:', demandasError);
          throw demandasError;
        }
        demandasData = demandasResult || [];
        console.log('✅ Demandas encontradas:', demandasData.length);
      } else {
        console.log('📋 Pulando demandas - filtro tipo:', filtros.tipo);
      }

      // Combinar e processar dados
      const todosDados = [
        ...(solicitacoesData || []).map(item => ({ ...item, tipo: 'solicitacao' as const })),
        ...(demandasData || []).map(item => ({ ...item, tipo: 'demanda' as const })),
      ];

      console.log('📊 Total de dados brutos:', todosDados.length);
      console.log('📊 Solicitações:', solicitacoesData.length, 'Demandas:', demandasData.length);

      const dadosProcessados = todosDados.map(processarItem);
      console.log('📊 Total de dados processados:', dadosProcessados.length);
      
      // Filtrar itens atrasados se necessário
      let dadosFiltrados = dadosProcessados;
      if (filtros.status.includes('atrasado')) {
        console.log('🔴 Filtrando itens atrasados...');
        dadosFiltrados = dadosFiltrados.filter(item => item.status_atraso);
        
        // Remover 'atrasado' do array de status para não filtrar novamente no banco
        const outrosStatus = filtros.status.filter(s => s !== 'atrasado');
        if (outrosStatus.length > 0) {
          dadosFiltrados = dadosFiltrados.filter(item => outrosStatus.includes(item.status));
        }
        console.log('🔴 Itens atrasados encontrados:', dadosFiltrados.length);
      } else if (filtros.status.length > 0) {
        // Filtrar por status normais
        dadosFiltrados = dadosFiltrados.filter(item => filtros.status.includes(item.status));
        console.log('🏷️ Itens filtrados por status:', dadosFiltrados.length);
      }
      
      // Log de amostra dos dados
      if (dadosFiltrados.length > 0) {
        console.log('📋 Amostra de dados:', dadosFiltrados[0]);
      }
      
      setDados(dadosFiltrados);

    } catch (err) {
      console.error('❌ Erro ao carregar dados dos relatórios:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
      console.log('🏁 Carregamento finalizado');
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
  console.log('🎯 Aplicando filtros:', JSON.stringify(filtros, null, 2));

  // Filtro de período - formatar datas para ISO 8601
  if (filtros.periodo.inicio) {
    const dataInicio = new Date(filtros.periodo.inicio).toISOString();
    console.log('📅 Filtro período início:', filtros.periodo.inicio, '→', dataInicio);
    query = query.gte('created_at', dataInicio);
  }
  if (filtros.periodo.fim) {
    const dataFim = new Date(filtros.periodo.fim);
    dataFim.setHours(23, 59, 59, 999); // Incluir o dia inteiro
    const dataFimISO = dataFim.toISOString();
    console.log('📅 Filtro período fim:', filtros.periodo.fim, '→', dataFimISO);
    query = query.lte('created_at', dataFimISO);
  }

  // Filtro de status (exceto "atrasado" que é calculado)
  if (filtros.status.length > 0) {
    const statusBanco = filtros.status.filter(s => s !== 'atrasado');
    if (statusBanco.length > 0) {
      console.log('🏷️ Filtro status (banco):', statusBanco);
      query = query.in('status', statusBanco);
    }
  }

  // Filtro de tipo - já aplicado no nível superior
  if (filtros.tipo && filtros.tipo !== 'todos') {
    console.log('📋 Filtro tipo será aplicado no nível superior:', filtros.tipo);
  }

  // Filtro de responsáveis - implementação simplificada por enquanto
  if (filtros.responsaveis.length > 0) {
    // TODO: Implementar conversão nome->UUID com cache
    // Por enquanto, não aplica filtro de responsáveis para evitar erros
    console.log('⚠️ Filtro de responsáveis (temporariamente desativado):', filtros.responsaveis);
  }

  // Filtro de usuário (apenas para não-admins)
  if (filtros.usuario === 'proprios') {
    console.log('👤 Filtro usuário: próprios (RLS já filtra)');
    // O RLS já filtra pelo usuário atual
  }

  console.log('✅ Filtros aplicados com sucesso');
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
  const statusAtraso = verificarAtraso(item.status, item.data_contato || null);
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
    // Buscar todos os UUIDs de responsáveis únicos
    const { data: solicitacoes } = await supabase
      .from('solicitacoes')
      .select('responsavel')
      .not('responsavel', 'is', null);

    const { data: demandas } = await supabase
      .from('demandas')
      .select('responsavel')
      .not('responsavel', 'is', null);

    // Combinar todos os UUIDs
    const todosUUIDs = [
      ...(solicitacoes || []).map(s => s.responsavel),
      ...(demandas || []).map(d => d.responsavel),
    ].filter(Boolean);

    // Remover duplicados
    const uuidsUnicos = Array.from(new Set(todosUUIDs));

    if (uuidsUnicos.length === 0) {
      return [];
    }

    // Buscar profiles correspondentes
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', uuidsUnicos);

    // Mapear UUIDs para nomes
    const profilesMap = new Map<string, string>();
    (profiles || []).forEach((profile: any) => {
      if (profile.full_name) {
        profilesMap.set(profile.id, profile.full_name);
      }
    });

    // Converter UUIDs para nomes
    const nomesResponsaveis = uuidsUnicos
      .map(uuid => profilesMap.get(uuid) || `ID: ${uuid.substring(0, 8)}...`)
      .filter(nome => nome && !nome.startsWith('ID:')) // Remover IDs não encontrados
      .sort((a, b) => a.localeCompare(b));

    return nomesResponsaveis;
  } catch (error) {
    console.error('Erro ao buscar responsáveis:', error);
    return [];
  }
};
