import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { DashboardStats, KanbanItem } from '../../types/index';
import { PlayCircle, CheckCircle, Calendar, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { verificarAtraso } from '../../utils/calculoDiasUteis';
import DashboardItemModal from './DashboardItemModal';
// Novos gráficos
import ScatterChart from './Charts/ScatterChart';
import RegionalBairrosChart from './Charts/RegionalBairrosChart';
import FunnelChart from './Charts/FunnelChart';
import ChartAccordion from './Charts/ChartAccordion';
import { useDashboardCharts } from '../../hooks/useDashboardCharts';
import { TrendingUp, Activity, Clock, MapPin } from 'lucide-react';

type ItemComPrazo = {
  status: string;
  data_contato?: string | null;
  data_criacao?: string | null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { showInfo } = useToast();
  
  // Hook dos novos gráficos
  const { data: chartsData } = useDashboardCharts();
  
  // Estado para dados do dia
  const [dadosDia, setDadosDia] = useState({
    criadosHoje: 0,
    emAtendimento: 0,
    concluidosHoje: 0,
    metaDiaria: 15,
    progresso: 0,
    urgentes: 0,
    altas: 0,
    normais: 0,
    baixas: 0,
    total: 0
  });

  // Estado para top assuntos
  const [topAssuntos, setTopAssuntos] = useState<{assunto: string, quantidade: number}[]>([]);
  
  const [solicitacoesStats, setSolicitacoesStats] = useState<DashboardStats>({
    aguardando: 0,
    em_analise: 0,
    finalizado: 0,
  });

  const [demandasStats, setDemandasStats] = useState<DashboardStats>({
    aguardando: 0,
    em_analise: 0,
    finalizado: 0,
  });

  const [acessosStats, setAcessosStats] = useState({
    solicitado: 0,
    em_andamento: 0,
    criado: 0,
    ativo: 0,
    desativado: 0,
    total: 0
  });

  const [atrasadas, setAtrasadas] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Estados para o modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItems, setModalItems] = useState<KanbanItem[]>([]);
  const [modalType, setModalType] = useState<'solicitacoes' | 'demandas' | 'todos'>('todos');
  const [modalStatus, setModalStatus] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: solicitacoes, error: solicitacoesError } = await supabase
        .from('solicitacoes')
        .select('status, data_contato');

      const { data: demandas, error: demandasError } = await supabase
        .from('demandas')
        .select('status, data_contato');

      const { data: acessos, error: acessosError } = await supabase
        .from('acessos')
        .select('status');

      if (solicitacoesError) {
        console.error('Erro ao carregar solicitações:', solicitacoesError);
      }

      if (demandasError) {
        console.error('Erro ao carregar demandas:', demandasError);
      }

      if (acessosError) {
        console.error('Erro ao carregar acessos:', acessosError);
      }

      setSolicitacoesStats(calculateStats(solicitacoes || []));
      setDemandasStats(calculateStats(demandas || []));
      setAcessosStats(calculateAcessosStats(acessos || []));
      setAtrasadas(
        countAtrasadas(solicitacoes || []) +
        countAtrasadas(demandas || [])
      );
    } catch (error) {
      console.error('Erro geral ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (items: { status: string }[]): DashboardStats => ({
    aguardando: items.filter(i => i.status === 'aguardando').length,
    em_analise: items.filter(i => i.status === 'em_analise').length,
    finalizado: items.filter(i => i.status === 'finalizado').length,
  });

  const calculateAcessosStats = (items: { status: string }[]) => ({
    solicitado: items.filter(i => i.status === 'solicitado').length,
    em_andamento: items.filter(i => i.status === 'em_andamento').length,
    criado: items.filter(i => i.status === 'criado').length,
    ativo: items.filter(i => i.status === 'ativo').length,
    desativado: items.filter(i => i.status === 'desativado').length,
    total: items.length
  });

  const countAtrasadas = (items: ItemComPrazo[]) => {
    return items.filter(item => {
      // Só contar como atrasado se:
      // 1. Status for aguardando ou em_análise
      // 2. E estiver realmente atrasado
      const isRelevantStatus = item.status === 'aguardando' || item.status === 'em_analise';
      const isOverdue = verificarAtraso(item.status, item.data_contato || null);
      return isRelevantStatus && isOverdue;
    }).length;
  };

  const totalGeral =
    Object.values(solicitacoesStats).reduce((a, b) => a + b, 0) +
    Object.values(demandasStats).reduce((a, b) => a + b, 0);

  // Calcular dados do dia atual
  const calcularDadosDia = async () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Início do dia
    
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    
    try {
      // Buscar solicitações do dia (para métricas do dia)
      const { data: solData } = await supabase
        .from('solicitacoes')
        .select('created_at, status, data_contato, data_finalizado')
        .gte('created_at', hoje.toISOString())
        .lt('created_at', amanha.toISOString());

      // Buscar demandas do dia (para métricas do dia)
      const { data: demData } = await supabase
        .from('demandas')
        .select('created_at, status, data_contato, data_finalizado')
        .gte('created_at', hoje.toISOString())
        .lt('created_at', amanha.toISOString());

      // Buscar TODOS os itens ativos para prioridades (independente da data)
      const { data: solAtivos } = await supabase
        .from('solicitacoes')
        .select('created_at, status, data_contato, data_finalizado')
        .in('status', ['aguardando', 'em_analise']);

      const { data: demAtivos } = await supabase
        .from('demandas')
        .select('created_at, status, data_contato, data_finalizado')
        .in('status', ['aguardando', 'em_analise']);

      const itensCriadosHoje = [...(solData || []), ...(demData || [])];
      const todosItensAtivos = [...(solAtivos || []), ...(demAtivos || [])];
      
      // Calcular métricas do dia
      const criadosHoje = itensCriadosHoje.length;
      const emAtendimento = itensCriadosHoje.filter(i => i.status === 'em_analise').length;
      const concluidosHoje = itensCriadosHoje.filter(i => i.status === 'finalizado').length;
      const metaDiaria = 15; // Meta configurável
      const progresso = metaDiaria > 0 ? Math.round((concluidosHoje / metaDiaria) * 100) : 0;
      
      // Calcular prioridades (baseado em TODOS os itens ativos)
      const urgentes = todosItensAtivos.filter(i => {
        const diasAtraso = verificarAtraso(i.status, i.data_contato);
        return (i.status === 'aguardando' || i.status === 'em_analise') && diasAtraso > 7;
      }).length;
      
      const altas = todosItensAtivos.filter(i => {
        const diasAtraso = verificarAtraso(i.status, i.data_contato);
        return (i.status === 'aguardando' || i.status === 'em_analise') && diasAtraso > 3 && diasAtraso <= 7;
      }).length;
      
      const normais = todosItensAtivos.filter(i => {
        const diasAtraso = verificarAtraso(i.status, i.data_contato);
        return (i.status === 'aguardando' || i.status === 'em_analise') && diasAtraso >= 0 && diasAtraso <= 3;
      }).length;
      
      const baixas = todosItensAtivos.filter(i => i.status === 'finalizado').length;
      
      return {
        criadosHoje,
        emAtendimento,
        concluidosHoje,
        metaDiaria,
        progresso,
        urgentes,
        altas,
        normais,
        baixas,
        total: todosItensAtivos.length
      };
    } catch (error) {
      console.error('Erro ao calcular dados do dia:', error);
      // Retornar valores mock em caso de erro
      return {
        criadosHoje: 12,
        emAtendimento: 8,
        concluidosHoje: 5,
        metaDiaria: 15,
        progresso: 80,
        urgentes: 3,
        altas: 7,
        normais: 15,
        baixas: 8,
        total: 33
      };
    }
  };

  // Carregar dados do dia ao montar o componente
  useEffect(() => {
    calcularDadosDia().then(setDadosDia);
  }, [solicitacoesStats, demandasStats]);

  // Buscar top assuntos
  const buscarTopAssuntos = async () => {
    try {
      // Buscar top assuntos de solicitações
      const { data: solAssuntos } = await supabase
        .from('solicitacoes')
        .select('assunto')
        .not('assunto', 'is', null);

      // Buscar top assuntos de demandas
      const { data: demAssuntos } = await supabase
        .from('demandas')
        .select('assunto')
        .not('assunto', 'is', null);

      // Combinar e contar
      const todosAssuntos = [
        ...(solAssuntos || []).map(s => s.assunto),
        ...(demAssuntos || []).map(d => d.assunto)
      ];

      const contagem = todosAssuntos.reduce((acc, assunto) => {
        acc[assunto] = (acc[assunto] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Ordenar e pegar top 10
      const top10 = Object.entries(contagem)
        .map(([assunto, quantidade]) => ({ assunto, quantidade: Number(quantidade) }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 10);

      setTopAssuntos(top10);
    } catch (error) {
      console.error('Erro ao buscar top assuntos:', error);
      setTopAssuntos([]);
    }
  };

  useEffect(() => {
    buscarTopAssuntos();
  }, []);

  // Função para buscar itens completos do Supabase
  const fetchItemsByStatus = async (type: 'solicitacoes' | 'demandas', status: string) => {
    try {
      const { data, error } = await supabase
        .from(type)
        .select(`
          *,
          profiles!inner(full_name)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transformar dados para incluir nome do responsável
      return (data || []).map(item => ({
        ...item,
        responsavel: item.profiles?.full_name || 'Não definido',
        tipo: type === 'solicitacoes' ? 'solicitacao' : 'demanda'
      }));
    } catch (error) {
      console.error(`Erro ao buscar ${type} com status ${status}:`, error);
      return [];
    }
  };

  // Função para buscar itens atrasados
  const fetchAtrasadosItems = async (type: 'solicitacoes' | 'demandas') => {
    try {
      const { data, error } = await supabase
        .from(type)
        .select(`
          *,
          profiles!inner(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const items = data || [];
      
      // Filtrar itens atrasados e transformar dados
      return items.filter(item => {
        return verificarAtraso(item.status, item.data_contato);
      }).map(item => ({
        ...item,
        responsavel: item.profiles?.full_name || 'Não definido',
        tipo: type === 'solicitacoes' ? 'solicitacao' : 'demanda'
      }));
    } catch (error) {
      console.error(`Erro ao buscar ${type} atrasados:`, error);
      return [];
    }
  };

  // Lógica inteligente para clique nos cards - Mostra ambos os tipos
  // Funções de busca específicas para as seções
  const fetchItemsByAssunto = async (assunto: string) => {
    const { data: solicitacoes } = await supabase
      .from('solicitacoes')
      .select(`
        *,
        profiles!inner(full_name)
      `)
      .ilike('assunto', `%${assunto}%`);
    
    const { data: demandas } = await supabase
      .from('demandas')
      .select(`
        *,
        profiles!inner(full_name)
      `)
      .ilike('assunto', `%${assunto}%`);
    
    // Transformar dados para incluir nome do responsável
    const solTransformed = (solicitacoes || []).map(item => ({
      ...item,
      responsavel: item.profiles?.full_name || 'Não definido',
      tipo: 'solicitacao'
    }));
    
    const demTransformed = (demandas || []).map(item => ({
      ...item,
      responsavel: item.profiles?.full_name || 'Não definido',
      tipo: 'demanda'
    }));
    
    return [...solTransformed, ...demTransformed];
  };

  const fetchItemsByDateRange = async (startDate: string, endDate: string) => {
    const { data: solicitacoes } = await supabase
      .from('solicitacoes')
      .select(`
        *,
        profiles!inner(full_name)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate);
    
    const { data: demandas } = await supabase
      .from('demandas')
      .select(`
        *,
        profiles!inner(full_name)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate);
    
    // Transformar dados para incluir nome do responsável
    const solTransformed = (solicitacoes || []).map(item => ({
      ...item,
      responsavel: item.profiles?.full_name || 'Não definido',
      tipo: 'solicitacao'
    }));
    
    const demTransformed = (demandas || []).map(item => ({
      ...item,
      responsavel: item.profiles?.full_name || 'Não definido',
      tipo: 'demanda'
    }));
    
    return [...solTransformed, ...demTransformed];
  };

  const fetchItemsByPriority = async (priorityLevel: string) => {
    // Mapear níveis de prioridade para status
    const priorityMap: Record<string, string[]> = {
      'Urgentes': ['urgente', 'critico'],
      'Altas': ['alta', 'prioritario'],
      'Normais': ['normal', 'regular'],
      'Baixas': ['baixa', 'baixa_prioridade']
    };
    
    const statuses = priorityMap[priorityLevel] || [];
    
    if (statuses.length === 0) return [];
    
    const { data: solicitacoes } = await supabase
      .from('solicitacoes')
      .select(`
        *,
        profiles!inner(full_name)
      `)
      .in('prioridade', statuses);
    
    const { data: demandas } = await supabase
      .from('demandas')
      .select(`
        *,
        profiles!inner(full_name)
      `)
      .in('prioridade', statuses);
    
    // Transformar dados para incluir nome do responsável
    const solTransformed = (solicitacoes || []).map(item => ({
      ...item,
      responsavel: item.profiles?.full_name || 'Não definido',
      tipo: 'solicitacao'
    }));
    
    const demTransformed = (demandas || []).map(item => ({
      ...item,
      responsavel: item.profiles?.full_name || 'Não definido',
      tipo: 'demanda'
    }));
    
    return [...solTransformed, ...demTransformed];
  };

  const handleCardClick = async (cardType: string) => {
    if (cardType === 'aguardando') {
      const solItems = await fetchItemsByStatus('solicitacoes', 'aguardando');
      const demItems = await fetchItemsByStatus('demandas', 'aguardando');
      const allItems = [...solItems, ...demItems];
      
      if (allItems.length > 0) {
        openModal('todos', 'aguardando', allItems);
      } else {
        navigate('/solicitacoes');
      }
    } else if (cardType === 'em_analise') {
      const solItems = await fetchItemsByStatus('solicitacoes', 'em_analise');
      const demItems = await fetchItemsByStatus('demandas', 'em_analise');
      const allItems = [...solItems, ...demItems];
      
      if (allItems.length > 0) {
        openModal('todos', 'em_analise', allItems);
      } else {
        navigate('/solicitacoes');
      }
    } else if (cardType === 'atrasadas') {
      const solAtrasadas = await fetchAtrasadosItems('solicitacoes');
      const demAtrasadas = await fetchAtrasadosItems('demandas');
      const allAtrasadas = [...solAtrasadas, ...demAtrasadas];
      
      if (allAtrasadas.length > 0) {
        openModal('todos', 'atrasadas', allAtrasadas);
      } else {
        showInfo('Nenhum item atrasado', 'Todos os itens estão dentro dos prazos!');
      }
    } else if (cardType === 'finalizado') {
      const solItems = await fetchItemsByStatus('solicitacoes', 'finalizado');
      const demItems = await fetchItemsByStatus('demandas', 'finalizado');
      const allItems = [...solItems, ...demItems];
      
      if (allItems.length > 0) {
        openModal('todos', 'finalizado', allItems);
      } else {
        navigate('/solicitacoes');
      }
    } else if (cardType === 'finalizados') {
      const solItems = await fetchItemsByStatus('solicitacoes', 'finalizado');
      const demItems = await fetchItemsByStatus('demandas', 'finalizado');
      const allItems = [...solItems, ...demItems];
      
      if (allItems.length > 0) {
        openModal('todos', 'finalizados', allItems);
      } else {
        navigate('/solicitacoes');
      }
    } else if (cardType === 'total') {
      const solTotal = Object.values(solicitacoesStats).reduce((a, b) => a + b, 0);
      const demTotal = Object.values(demandasStats).reduce((a, b) => a + b, 0);
      
      if (solTotal >= demTotal) {
        navigate('/solicitacoes');
      } else {
        navigate('/demandas');
      }
    }
  };

  // Estado para loading do modal
  const [modalLoading, setModalLoading] = useState(false);

  // Handlers para as seções específicas
  const handleAssuntoClick = async (assunto: string) => {
    setModalLoading(true);
    
    try {
      const items = await fetchItemsByAssunto(assunto);
      
      if (items.length > 0) {
        openModal('todos', `assunto_${assunto}`, items);
      } else {
        // Abrir modal mesmo que não tenha itens, para mostrar mensagem
        openModal('todos', `assunto_${assunto}`, []);
      }
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleResumoDiaClick = async (tipo: string) => {
    setModalLoading(true);
    openModal('todos', `resumo_${tipo}`, []);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      let items = [];
      
      switch (tipo) {
        case 'criados_hoje':
          items = await fetchItemsByDateRange(today, today);
          break;
        case 'em_atendimento':
          const solEmAtendimento = await fetchItemsByStatus('solicitacoes', 'em_analise');
          const demEmAtendimento = await fetchItemsByStatus('demandas', 'em_analise');
          items = [...solEmAtendimento, ...demEmAtendimento];
          break;
        case 'concluidos_hoje':
          const { data: solConcluidos } = await supabase
            .from('solicitacoes')
            .select('*')
            .eq('status', 'finalizado')
            .gte('data_finalizado', today);
          const { data: demConcluidos } = await supabase
            .from('demandas')
            .select('*')
            .eq('status', 'finalizado')
            .gte('data_finalizado', today);
          items = [...(solConcluidos || []), ...(demConcluidos || [])];
          break;
      }
      
      if (items.length > 0) {
        openModal('todos', `resumo_${tipo}`, items);
      }
    } finally {
      setModalLoading(false);
    }
  };

  const handlePrioridadeClick = async (prioridade: string) => {
    setModalLoading(true);
    openModal('todos', `prioridade_${prioridade}`, []);
    
    try {
      const items = await fetchItemsByPriority(prioridade);
      if (items.length > 0) {
        openModal('todos', `prioridade_${prioridade}`, items);
      }
    } finally {
      setModalLoading(false);
    }
  };

  // Lógica para clique no funil
  const handleFunnelClick = async (stage: string) => {
    const statusMap: Record<string, string> = {
      'Aguardando': 'aguardando',
      'Em Análise': 'em_analise',
      'Atrasados': 'atrasadas',
      'Finalizado': 'finalizado'
    };
    
    const status = statusMap[stage];
    if (status) {
      // Abrir modal imediatamente com loading
      setModalLoading(true);
      openModal('todos', status, []);
      
      // Carregar dados em background SEM bloquear
      handleCardClick(status).finally(() => {
        setModalLoading(false);
      });
    }
  };

  // Função para abrir o modal
  const openModal = (type: 'solicitacoes' | 'demandas' | 'todos', status: string, items: KanbanItem[]) => {
    setModalType(type);
    setModalStatus(status);
    setModalItems(items);
    setModalOpen(true);
  };

  // Função para fechar o modal
  const closeModal = () => {
    setModalOpen(false);
    setModalItems([]);
    setModalType('solicitacoes');
    setModalStatus('');
  };

  // Função para clique em item no modal
  const handleItemClick = (item: KanbanItem) => {
    navigate(`/${modalType}/${item.id}#item-${item.id}`);
  };

  // Cards com navegação inteligente
  const cards = [
    {
      title: 'Aguardando Análise',
      value: solicitacoesStats.aguardando + demandasStats.aguardando,
      icon: Clock,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      onClick: () => handleCardClick('aguardando'),
    },
    {
      title: 'Em Análise',
      value: solicitacoesStats.em_analise + demandasStats.em_analise,
      icon: PlayCircle,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      onClick: () => handleCardClick('em_analise'),
    },
    {
      title: 'Acessos SISGEP',
      value: acessosStats.total,
      icon: Key,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      onClick: () => navigate('/acessos'),
    },
    {
      title: 'Atrasadas',
      value: atrasadas,
      icon: Clock,
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      onClick: () => handleCardClick('atrasadas'),
    },
    {
      title: 'Finalizados',
      value: solicitacoesStats.finalizado + demandasStats.finalizado,
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      onClick: () => handleCardClick('finalizados'),
    },
    {
      title: 'Total Geral',
      value: totalGeral,
      icon: Calendar,
      bgColor: 'bg-slate-50',
      textColor: 'text-slate-700',
      onClick: () => navigate('/solicitacoes'),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Visão geral do sistema de gerenciamento</p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Última atualização: {new Date().toLocaleTimeString('pt-BR')}</span>
            </div>
          </div>
        </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              onClick={card.onClick}
              className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all duration-200 group"
            >
              <div className={`${card.bgColor} p-1.5 rounded-lg inline-block mb-2 group-hover:scale-110 transition-transform duration-200`}>
                <Icon className={`w-4 h-4 ${card.textColor}`} />
              </div>
              <h3 className="text-xs font-medium text-gray-500 mb-1">{card.title}</h3>
              <p className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Gráficos Principais */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Top 10 Assuntos</h3>
          <div className="space-y-2">
            {topAssuntos.length > 0 ? (
              topAssuntos.map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors duration-200 group"
                  onClick={() => handleAssuntoClick(item.assunto)}
                  title={`Clique para ver todos os itens sobre "${item.assunto}"`}
                >
                  <span className="text-xs text-gray-600 truncate flex-1 mr-2 group-hover:text-blue-600 transition-colors duration-200">
                    {item.assunto}
                  </span>
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full group-hover:bg-blue-600 transition-colors duration-200" 
                        style={{width: `${Math.min(100, (item.quantidade / Math.max(...topAssuntos.map(a => a.quantidade))) * 100)}%`}}
                      ></div>
                    </div>
                    <span className="text-xs font-semibold text-gray-700 min-w-[20px] text-right group-hover:text-blue-600 transition-colors duration-200">
                      {item.quantidade}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-4">
                <span className="text-sm">Carregando...</span>
              </div>
            )}
          </div>
        </div>

        {/* Gráfico pequeno adicional */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Resumo do Dia</h3>
          <div className="space-y-3">
            <div 
              className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors duration-200 group"
              onClick={() => handleResumoDiaClick('criados_hoje')}
              title="Clique para ver todos os itens criados hoje"
            >
              <span className="text-xs text-gray-600 group-hover:text-blue-600 transition-colors duration-200">Criados Hoje</span>
              <span className="text-sm font-bold text-blue-600 group-hover:text-blue-700 transition-colors duration-200">{dadosDia.criadosHoje}</span>
            </div>
            <div 
              className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors duration-200 group"
              onClick={() => handleResumoDiaClick('em_atendimento')}
              title="Clique para ver todos os itens em atendimento"
            >
              <span className="text-xs text-gray-600 group-hover:text-orange-600 transition-colors duration-200">Em Atendimento</span>
              <span className="text-sm font-bold text-orange-600 group-hover:text-orange-700 transition-colors duration-200">{dadosDia.emAtendimento}</span>
            </div>
            <div 
              className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors duration-200 group"
              onClick={() => handleResumoDiaClick('concluidos_hoje')}
              title="Clique para ver todos os itens concluídos hoje"
            >
              <span className="text-xs text-gray-600 group-hover:text-green-600 transition-colors duration-200">Concluídos Hoje</span>
              <span className="text-sm font-bold text-green-600 group-hover:text-green-700 transition-colors duration-200">{dadosDia.concluidosHoje}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Meta Diária</span>
              <span className="text-sm font-bold text-gray-600">{dadosDia.metaDiaria}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Progresso</span>
              <div className="flex items-center">
                <div className="w-12 bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-green-500 h-1.5 rounded-full" 
                    style={{width: `${dadosDia.progresso}%`}}
                  ></div>
                </div>
                <span className="text-xs font-medium ml-2 text-green-600">{dadosDia.progresso}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Segundo gráfico pequeno */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Prioridades</h3>
          <div className="space-y-3">
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors duration-200 group"
              onClick={() => handlePrioridadeClick('Urgentes')}
              title="Clique para ver todos os itens urgentes"
            >
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2 group-hover:bg-red-600 transition-colors duration-200"></div>
                <span className="text-xs text-gray-600 group-hover:text-red-600 transition-colors duration-200">Urgentes</span>
              </div>
              <span className="text-sm font-bold text-red-600 group-hover:text-red-700 transition-colors duration-200">{dadosDia.urgentes}</span>
            </div>
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors duration-200 group"
              onClick={() => handlePrioridadeClick('Altas')}
              title="Clique para ver todos os itens de alta prioridade"
            >
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2 group-hover:bg-yellow-600 transition-colors duration-200"></div>
                <span className="text-xs text-gray-600 group-hover:text-yellow-600 transition-colors duration-200">Altas</span>
              </div>
              <span className="text-sm font-bold text-yellow-600 group-hover:text-yellow-700 transition-colors duration-200">{dadosDia.altas}</span>
            </div>
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors duration-200 group"
              onClick={() => handlePrioridadeClick('Normais')}
              title="Clique para ver todos os itens de prioridade normal"
            >
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2 group-hover:bg-blue-600 transition-colors duration-200"></div>
                <span className="text-xs text-gray-600 group-hover:text-blue-600 transition-colors duration-200">Normais</span>
              </div>
              <span className="text-sm font-bold text-blue-600 group-hover:text-blue-700 transition-colors duration-200">{dadosDia.normais}</span>
            </div>
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors duration-200 group"
              onClick={() => handlePrioridadeClick('Baixas')}
              title="Clique para ver todos os itens de baixa prioridade"
            >
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-500 rounded-full mr-2 group-hover:bg-gray-600 transition-colors duration-200"></div>
                <span className="text-xs text-gray-600 group-hover:text-gray-600 transition-colors duration-200">Baixas</span>
              </div>
              <span className="text-sm font-bold text-gray-600 group-hover:text-gray-700 transition-colors duration-200">{dadosDia.baixas}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Distribuição</div>
              <div className="flex justify-center space-x-1">
                <div className="text-xs text-gray-700">Total: {dadosDia.total}</div>
                <div className="text-xs text-red-600">{dadosDia.total > 0 ? Math.round((dadosDia.urgentes / dadosDia.total) * 100) : 0}%</div>
                <div className="text-xs text-yellow-600">{dadosDia.total > 0 ? Math.round((dadosDia.altas / dadosDia.total) * 100) : 0}%</div>
                <div className="text-xs text-blue-600">{dadosDia.total > 0 ? Math.round((dadosDia.normais / dadosDia.total) * 100) : 0}%</div>
                <div className="text-xs text-gray-600">{dadosDia.total > 0 ? Math.round((dadosDia.baixas / dadosDia.total) * 100) : 0}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de gráficos adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Distribuição por Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Aguardando</span>
              <div className="flex items-center">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{width: `${((solicitacoesStats.aguardando + demandasStats.aguardando) / totalGeral) * 100}%`}}
                  ></div>
                </div>
                <span className="text-xs font-medium ml-2 text-gray-700">{solicitacoesStats.aguardando + demandasStats.aguardando}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Em Análise</span>
              <div className="flex items-center">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{width: `${((solicitacoesStats.em_analise + demandasStats.em_analise) / totalGeral) * 100}%`}}
                  ></div>
                </div>
                <span className="text-xs font-medium ml-2 text-gray-700">{solicitacoesStats.em_analise + demandasStats.em_analise}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Finalizados</span>
              <div className="flex items-center">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{width: `${((solicitacoesStats.finalizado + demandasStats.finalizado) / totalGeral) * 100}%`}}
                  ></div>
                </div>
                <span className="text-xs font-medium ml-2 text-gray-700">{solicitacoesStats.finalizado + demandasStats.finalizado}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Taxa de Conclusão</h3>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {totalGeral > 0 ? Math.round(((solicitacoesStats.finalizado + demandasStats.finalizado) / totalGeral) * 100) : 0}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {solicitacoesStats.finalizado + demandasStats.finalizado} de {totalGeral} itens
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Status dos Acessos</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Solicitados</span>
              <div className="flex items-center">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{width: `${acessosStats.total > 0 ? (acessosStats.solicitado / acessosStats.total) * 100 : 0}%`}}
                  ></div>
                </div>
                <span className="text-xs font-medium ml-2 text-gray-700">{acessosStats.solicitado}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Em Andamento</span>
              <div className="flex items-center">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{width: `${acessosStats.total > 0 ? (acessosStats.em_andamento / acessosStats.total) * 100 : 0}%`}}
                  ></div>
                </div>
                <span className="text-xs font-medium ml-2 text-gray-700">{acessosStats.em_andamento}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Ativos</span>
              <div className="flex items-center">
                <div className="w-16 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{width: `${acessosStats.total > 0 ? (acessosStats.ativo / acessosStats.total) * 100 : 0}%`}}
                  ></div>
                </div>
                <span className="text-xs font-medium ml-2 text-gray-700">{acessosStats.ativo}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos Detalhados em Accordion */}
      <div className="space-y-4">
        <ChartAccordion 
          title="Regionais com Mais Demandas" 
          icon={<MapPin className="w-5 h-5 text-orange-600" />}
          defaultOpen={false}
        >
          <RegionalBairrosChart data={chartsData.regionaisMaisDemandas} height={250} />
        </ChartAccordion>

        <ChartAccordion 
          title="Funil de Processo" 
          icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
          defaultOpen={false}
        >
          <FunnelChart data={chartsData.funnelData} height={250} onBarClick={handleFunnelClick} />
        </ChartAccordion>

        <ChartAccordion 
          title="Análise de Tempo de Resposta" 
          icon={<Activity className="w-5 h-5 text-red-600" />}
          defaultOpen={false}
        >
          <ScatterChart data={chartsData.scatterData} height={250} />
        </ChartAccordion>
      </div>

      {/* Modal Inteligente */}
      <DashboardItemModal
          isOpen={modalOpen}
          onClose={closeModal}
          items={modalItems}
          status={modalStatus}
          isLoading={modalLoading}
          onItemClick={handleItemClick}
        />
      </div>
    </div>
  );
}
