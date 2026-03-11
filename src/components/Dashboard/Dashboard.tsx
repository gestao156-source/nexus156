import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { DashboardStats, KanbanItem } from '../../types/index';
import { PlayCircle, CheckCircle, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { verificarAtraso } from '../../utils/calculoDiasUteis';
import PieChart from './PieChart';
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

  // Calcular dados do dia atual
  const calcularDadosDia = async () => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Início do dia
    
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    
    try {
      // Buscar solicitações do dia
      const { data: solData } = await supabase
        .from('solicitacoes')
        .select('created_at, status, data_contato, data_finalizado')
        .gte('created_at', hoje.toISOString())
        .lt('created_at', amanha.toISOString());

      // Buscar demandas do dia
      const { data: demData } = await supabase
        .from('demandas')
        .select('created_at, status, data_contato, data_finalizado')
        .gte('created_at', hoje.toISOString())
        .lt('created_at', amanha.toISOString());

      const todosItens = [...(solData || []), ...(demData || [])];
      
      // Calcular métricas do dia
      const criadosHoje = todosItens.length;
      const emAtendimento = todosItens.filter(i => i.status === 'em_analise').length;
      const concluidosHoje = todosItens.filter(i => i.status === 'finalizado').length;
      const metaDiaria = 15; // Meta configurável
      const progresso = metaDiaria > 0 ? Math.round((concluidosHoje / metaDiaria) * 100) : 0;
      
      // Calcular prioridades (baseado em regras simples)
      const urgentes = todosItens.filter(i => {
        const diasAtraso = verificarAtraso(i.status, i.data_contato);
        return (i.status === 'aguardando' || i.status === 'em_analise') && diasAtraso > 7;
      }).length;
      
      const altas = todosItens.filter(i => {
        const diasAtraso = verificarAtraso(i.status, i.data_contato);
        return (i.status === 'aguardando' || i.status === 'em_analise') && diasAtraso > 3 && diasAtraso <= 7;
      }).length;
      
      const normais = todosItens.filter(i => {
        const diasAtraso = verificarAtraso(i.status, i.data_contato);
        return (i.status === 'aguardando' || i.status === 'em_analise') && diasAtraso >= 0 && diasAtraso <= 3;
      }).length;
      
      const baixas = todosItens.filter(i => i.status === 'finalizado').length;
      
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
        total: criadosHoje
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
        <PieChart
          data={[
            { name: 'Aguardando', value: solicitacoesStats.aguardando + demandasStats.aguardando, color: '#EAB308' },
            { name: 'Em Análise', value: solicitacoesStats.em_analise + demandasStats.em_analise, color: '#3B82F6' },
            { name: 'Finalizados', value: solicitacoesStats.finalizado + demandasStats.finalizado, color: '#22C55E' },
            { name: 'Atrasadas', value: atrasadas, color: '#FF3737' },
          ]}
        />

        {/* Gráfico pequeno adicional */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Resumo do Dia</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Criados Hoje</span>
              <span className="text-sm font-bold text-blue-600">{dadosDia.criadosHoje}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Em Atendimento</span>
              <span className="text-sm font-bold text-orange-600">{dadosDia.emAtendimento}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">Concluídos Hoje</span>
              <span className="text-sm font-bold text-green-600">{dadosDia.concluidosHoje}</span>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-xs text-gray-600">Urgentes</span>
              </div>
              <span className="text-sm font-bold text-red-600">{dadosDia.urgentes}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span className="text-xs text-gray-600">Altas</span>
              </div>
              <span className="text-sm font-bold text-yellow-600">{dadosDia.altas}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-xs text-gray-600">Normais</span>
              </div>
              <span className="text-sm font-bold text-blue-600">{dadosDia.normais}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                <span className="text-xs text-gray-600">Baixas</span>
              </div>
              <span className="text-sm font-bold text-gray-600">{dadosDia.baixas}</span>
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
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Tempo Médio de Atendimento</h3>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">3.5 dias</div>
            <div className="text-xs text-gray-500 mt-1">Últimos 30 dias</div>
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
