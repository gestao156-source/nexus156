import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { DashboardStats, KanbanItem } from '../../types/index';
import { Clock, PlayCircle, CheckCircle, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { verificarAtraso } from '../../utils/calculoDiasUteis';
import PieChart from './PieChart';
import BarChart from './BarChart';
import DashboardItemModal from './DashboardItemModal';

type ItemComPrazo = {
  status: string;
  data_contato?: string | null;
  data_criacao?: string | null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { showInfo } = useToast();
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
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
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
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const items = data || [];
      
      return items.filter(item => {
        return verificarAtraso(item.status, item.data_contato);
      });
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
    navigate(`/${modalType}?itemId=${item.id}#item-${item.id}`);
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
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              onClick={card.onClick}
              className="bg-white rounded-xl border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-all"
            >
              <div className={`${card.bgColor} p-3 rounded-lg inline-block mb-4`}>
                <Icon className={`w-6 h-6 ${card.textColor}`} />
              </div>
              <h3 className="text-sm text-gray-600">{card.title}</h3>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChart
          data={[
            { name: 'Aguardando', value: solicitacoesStats.aguardando + demandasStats.aguardando, color: '#EAB308' },
            { name: 'Em Análise', value: solicitacoesStats.em_analise + demandasStats.em_analise, color: '#3B82F6' },
            { name: 'Finalizados', value: solicitacoesStats.finalizado + demandasStats.finalizado, color: '#22C55E' },
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
  );
}
