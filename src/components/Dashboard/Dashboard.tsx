import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { DashboardStats, KanbanItem } from '../../types/index';
import { PlayCircle, CheckCircle, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { verificarAtraso } from '../../utils/calculoDiasUteis';
import PieChart from './PieChart';
import BarChart from './BarChart';
import DashboardItemModal from './DashboardItemModal';
// Novos gráficos
import AreaChart from './Charts/AreaChart';
import ScatterChart from './Charts/ScatterChart';
import RegionalBairrosChart from './Charts/RegionalBairrosChart';
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

      if (solicitacoesError) {
        console.error('Erro ao carregar solicitações:', solicitacoesError);
      }

      if (demandasError) {
        console.error('Erro ao carregar demandas:', demandasError);
      }

      setSolicitacoesStats(calculateStats(solicitacoes || []));
      setDemandasStats(calculateStats(demandas || []));
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

  const countAtrasadas = (items: ItemComPrazo[]) => {
    return items.filter(item => {
      return verificarAtraso(item.status, item.data_contato || null);
    }).length;
  };

  const totalGeral =
    Object.values(solicitacoesStats).reduce((a, b) => a + b, 0) +
    Object.values(demandasStats).reduce((a, b) => a + b, 0);

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              onClick={card.onClick}
              className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all duration-200 group"
            >
              <div className={`${card.bgColor} p-2 rounded-lg inline-block mb-3 group-hover:scale-110 transition-transform duration-200`}>
                <Icon className={`w-5 h-5 ${card.textColor}`} />
              </div>
              <h3 className="text-xs font-medium text-gray-500 mb-1">{card.title}</h3>
              <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gráficos Principais */}
        <PieChart
          data={[
            { name: 'Aguardando', value: solicitacoesStats.aguardando + demandasStats.aguardando, color: '#EAB308' },
            { name: 'Em Análise', value: solicitacoesStats.em_analise + demandasStats.em_analise, color: '#3B82F6' },
            { name: 'Finalizados', value: solicitacoesStats.finalizado + demandasStats.finalizado, color: '#22C55E' },
            { name: 'Atrasadas', value: atrasadas, color: '#FF3737' },
          ]}
        />
        
        <BarChart
          data={[
            { name: 'Solicitações', value: solicitacoesStats.aguardando + solicitacoesStats.em_analise + solicitacoesStats.finalizado, color: '#3B82F6' },
            { name: 'Demandas', value: demandasStats.aguardando + demandasStats.em_analise + demandasStats.finalizado, color: '#8B5CF6' },
            { name: 'Atrasadas', value: atrasadas, color: '#FF3737' },
          ]}
        />
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
          title="Análise de Backlog" 
          icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
          defaultOpen={false}
        >
          <AreaChart data={chartsData.backlogData} height={250} />
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
        type={modalType}
        status={modalStatus}
        onItemClick={handleItemClick}
      />
      </div>
    </div>
  );
}
