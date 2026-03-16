import { useState, useEffect } from 'react';
import { subDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import Logger from '../utils/logger';
import { 
  TimeSeriesData, 
  ScatterData, 
  FunnelData, 
  RegionalData, 
  PerformerData, 
  AverageTimeData 
} from '../components/Dashboard/Charts/chart-types';
import { getRegionalPorId, encontrarRegionalPorBairro } from '../utils/regionalUtils';
import { verificarAtraso } from '../utils/calculoDiasUteis';

export function useDashboardCharts() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dados dos gráficos
  const [evolutionData, setEvolutionData] = useState<TimeSeriesData[]>([]);
  const [backlogData, setBacklogData] = useState<TimeSeriesData[]>([]);
  const [averageTimeData, setAverageTimeData] = useState<AverageTimeData[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelData[]>([]);
  const [topPerformersData, setTopPerformersData] = useState<PerformerData[]>([]);
  const [regionalData, setRegionalData] = useState<RegionalData[]>([]);
  const [scatterData, setScatterData] = useState<ScatterData[]>([]);
  const [regionaisMaisDemandas, setRegionaisMaisDemandas] = useState<RegionalData[]>([]);

  // 1. Dados de evolução temporal
  const fetchEvolutionData = async (): Promise<TimeSeriesData[]> => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    
    // Buscar solicitações criadas por dia
    const { data: solCriadas } = await supabase
      .from('solicitacoes')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Buscar demandas criadas por dia
    const { data: demCriadas } = await supabase
      .from('demandas')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Buscar solicitações finalizadas por dia
    const { data: solFinalizadas } = await supabase
      .from('solicitacoes')
      .select('data_finalizado')
      .gte('data_finalizado', thirtyDaysAgo.toISOString())
      .not('data_finalizado', 'is', null);

    // Buscar demandas finalizadas por dia
    const { data: demFinalizadas } = await supabase
      .from('demandas')
      .select('data_finalizado')
      .gte('data_finalizado', thirtyDaysAgo.toISOString())
      .not('data_finalizado', 'is', null);

    // Agrupar dados por dia
    const dailyData: Record<string, { criadas: number; finalizadas: number }> = {};
    
    // Inicializar todos os dias do período
    for (let i = 0; i < 30; i++) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      dailyData[date] = { criadas: 0, finalizadas: 0 };
    }

    // Contar solicitações criadas
    (solCriadas || []).forEach(item => {
      const date = format(new Date(item.created_at), 'yyyy-MM-dd');
      if (dailyData[date]) dailyData[date].criadas++;
    });

    // Contar demandas criadas
    (demCriadas || []).forEach(item => {
      const date = format(new Date(item.created_at), 'yyyy-MM-dd');
      if (dailyData[date]) dailyData[date].criadas++;
    });

    // Contar solicitações finalizadas
    (solFinalizadas || []).forEach(item => {
      const date = format(new Date(item.data_finalizado), 'yyyy-MM-dd');
      if (dailyData[date]) dailyData[date].finalizadas++;
    });

    // Contar demandas finalizadas
    (demFinalizadas || []).forEach(item => {
      const date = format(new Date(item.data_finalizado), 'yyyy-MM-dd');
      if (dailyData[date]) dailyData[date].finalizadas++;
    });

    // Converter para o formato do gráfico
    return Object.entries(dailyData)
      .map(([date, data]) => ({
        date: format(new Date(date), 'dd/MM', { locale: ptBR }),
        value: data.criadas,
        category: 'Criadas'
      }))
      .reverse();
  };

  // 2. Dados de backlog
  const fetchBacklogData = async (): Promise<TimeSeriesData[]> => {
    // Buscar TODOS os itens (não só dos últimos 30 dias)
    const { data: solicitacoes } = await supabase
      .from('solicitacoes')
      .select('created_at, status, data_finalizado');

    const { data: demandas } = await supabase
      .from('demandas')
      .select('created_at, status, data_finalizado');

    // Agrupar dados por dia
    const dailyData: Record<string, { criados: number; finalizados: number }> = {};
    
    // Inicializar todos os dias do período
    for (let i = 0; i < 30; i++) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      dailyData[date] = { criados: 0, finalizados: 0 };
    }

    // Contar itens criados no período
    [...(solicitacoes || []), ...(demandas || [])].forEach(item => {
      const createdDate = format(new Date(item.created_at), 'yyyy-MM-dd');
      if (dailyData[createdDate]) {
        dailyData[createdDate].criados++;
      }
    });

    // Contar itens finalizados no período
    [...(solicitacoes || []), ...(demandas || [])].forEach(item => {
      if (item.data_finalizado) {
        const finishedDate = format(new Date(item.data_finalizado), 'yyyy-MM-dd');
        if (dailyData[finishedDate]) {
          dailyData[finishedDate].finalizados++;
        }
      }
    });

    // Calcular backlog acumulado
    let backlogAcumulado = 0;
    const backlogData: TimeSeriesData[] = [];
    
    // Processar dias em ordem cronológica (do mais antigo para o mais novo)
    const sortedDates = Object.keys(dailyData).sort();
    
    sortedDates.forEach(date => {
      const dayData = dailyData[date];
      backlogAcumulado += dayData.criados - dayData.finalizados;
      
      backlogData.push({
        date: format(new Date(date), 'dd/MM', { locale: ptBR }),
        value: Math.max(0, backlogAcumulado), // Não pode ser negativo
        category: 'Backlog'
      });
    });

    return backlogData;
  };

  // 3. Dados de tempo médio
  const fetchAverageTimeData = async (): Promise<AverageTimeData[]> => {
    // Buscar itens finalizados
    const { data: solicitacoes } = await supabase
      .from('solicitacoes')
      .select('created_at, data_finalizado, status, protocolo');

    const { data: demandas } = await supabase
      .from('demandas')
      .select('created_at, data_finalizado, status, protocolo');

    const allItems = [...(solicitacoes || []), ...(demandas || [])];
    
    return allItems.map(item => {
      const created = new Date(item.created_at).getTime();
      const finished = item.data_finalizado ? new Date(item.data_finalizado).getTime() : created;
      const days = Math.round((finished - created) / (1000 * 60 * 60 * 24));
      
      return {
        status: item.status || 'pendente',
        days,
        count: 1
      };
    });
  };

  // 4. Dados do funil
  const fetchFunnelData = async (): Promise<FunnelData[]> => {
    // Buscar contagem por status
    const { data: solicitacoes } = await supabase
      .from('solicitacoes')
      .select('status, data_contato');

    const { data: demandas } = await supabase
      .from('demandas')
      .select('status, data_contato');

    const allItems = [...(solicitacoes || []), ...(demandas || [])];
    
    // Agrupar por status
    const statusCount = allItems.reduce((acc, item) => {
      const status = item.status || 'pendente';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Contar itens atrasados
    const atrasadosCount = allItems.filter(item => {
      return verificarAtraso(item.status, item.data_contato);
    }).length;

    // Mapear para estágios do funil
    const stages = [
      { stage: 'Aguardando', value: statusCount['aguardando'] || 0 },
      { stage: 'Em Análise', value: statusCount['em_analise'] || 0 },
      { stage: 'Atrasados', value: atrasadosCount },
      { stage: 'Finalizado', value: statusCount['finalizado'] || 0 }
    ];

    // Calcular taxas de conversão
    const total = stages.reduce((sum, stage) => sum + stage.value, 0); // Total de todos os itens
    
    const result = stages.map((stage) => ({
      ...stage,
      conversion: total > 0 ? Math.round((stage.value / total) * 100) : 0
    }));
    
    return result;
  };

  // 5. Top performers
  const fetchTopPerformersData = async (): Promise<PerformerData[]> => {
    // Buscar itens com responsáveis
    const { data: solicitacoes } = await supabase
      .from('solicitacoes')
      .select('responsavel, status, created_at, data_finalizado');

    const { data: demandas } = await supabase
      .from('demandas')
      .select('responsavel, status, created_at, data_finalizado');

    const allItems = [...(solicitacoes || []), ...(demandas || [])];
    
    // Agrupar por responsável
    const performerData = allItems.reduce((acc, item) => {
      const responsible = item.responsavel || 'Não atribuído';
      
      if (!acc[responsible]) {
        acc[responsible] = { completed: 0, pending: 0, totalTime: 0, count: 0 };
      }
      
      if (item.status === 'finalizado' && item.data_finalizado) {
        acc[responsible].completed++;
        const days = Math.round(
          (new Date(item.data_finalizado).getTime() - new Date(item.created_at).getTime()) 
          / (1000 * 60 * 60 * 24)
        );
        acc[responsible].totalTime += days;
        acc[responsible].count++;
      } else {
        acc[responsible].pending++;
      }
      
      return acc;
    }, {} as Record<string, any>);

    // Converter para o formato do gráfico
    return Object.entries(performerData)
      .map(([name, data]) => ({
        name,
        completed: data.completed,
        pending: data.pending,
        efficiency: data.count > 0 ? Math.round(data.totalTime / data.count) : 0
      }))
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 10);
  };

  // 6. Dados regionais
  const fetchRegionalData = async (): Promise<RegionalData[]> => {
    // Buscar dados geográficos
    const { data: solicitacoes } = await supabase
      .from('solicitacoes')
      .select('endereco_regional, endereco_bairro, endereco_cep');

    const { data: demandas } = await supabase
      .from('demandas')
      .select('endereco_regional, endereco_bairro, endereco_cep');

    // Filtrar apenas itens que têm endereço (bairro ou regional ou CEP)
    const allItems = [...(solicitacoes || []), ...(demandas || [])]
      .filter(item => item.endereco_bairro || item.endereco_regional || item.endereco_cep);
    
    // Agrupar por regional
    const regionalCount = allItems.reduce((acc, item) => {
      const regional = item.endereco_regional || 'Não definida';
      acc[regional] = (acc[regional] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Converter para o formato do gráfico
    return Object.entries(regionalCount)
      .map(([region, value]) => ({
        region,
        value
      }))
      .sort((a, b) => b.value - a.value);
  };

  // 7. Dados de dispersão
  const fetchScatterData = async (): Promise<ScatterData[]> => {
    // Buscar itens com coordenadas
    const { data: solicitacoes } = await supabase
      .from('solicitacoes')
      .select('created_at, data_finalizado, status, protocolo');

    const { data: demandas } = await supabase
      .from('demandas')
      .select('created_at, data_finalizado, status, protocolo');

    const allItems = [...(solicitacoes || []), ...(demandas || [])];
    
    return allItems.map(item => {
      const created = new Date(item.created_at).getTime();
      const finished = item.data_finalizado ? new Date(item.data_finalizado).getTime() : created;
      const days = Math.round((finished - created) / (1000 * 60 * 60 * 24));
      
      return {
        x: days,
        y: item.status === 'finalizado' ? 1 : 0,
        name: item.protocolo || 'N/A',
        color: item.status === 'finalizado' ? '#10b981' : '#ef4444'
      };
    });
  };

  // 8. Regionais com mais demandas
  const fetchRegionaisMaisDemandas = async (): Promise<RegionalData[]> => {
    const { data: solicitacoes } = await supabase
      .from('solicitacoes')
      .select('endereco_regional, endereco_bairro');

    const { data: demandas } = await supabase
      .from('demandas')
      .select('endereco_regional, endereco_bairro');

    // Filtrar apenas itens que têm endereço (bairro ou regional)
    const allItems = [...(solicitacoes || []), ...(demandas || [])]
      .filter(item => item.endereco_bairro || item.endereco_regional);
    
    // Agrupar por regional
    const grouped = allItems.reduce((acc, item) => {
      let regionalId = item.endereco_regional;
      
      // Se não tiver regional, calcula pelo bairro
      if (!regionalId && item.endereco_bairro) {
        regionalId = encontrarRegionalPorBairro(item.endereco_bairro).toString();
      }
      
      const regional = getRegionalPorId(parseInt(regionalId));
      const regionalName = regional?.nome || 'Não definido';
      
      if (!acc[regionalName]) {
        acc[regionalName] = 0;
      }
      acc[regionalName]++;
      return acc;
    }, {} as Record<string, number>);

    const result = Object.entries(grouped).map(([region, value]) => ({
      region,
      value
    })).sort((a, b) => b.value - a.value); // Maior primeiro

    return result;
  };

  // 9. Buscar bairros por regional
  const fetchBairrosPorRegional = async (regional: string): Promise<any[]> => {
    try {
      const { data: solicitacoes } = await supabase
        .from('solicitacoes')
        .select('endereco_bairro, endereco_regional');

      const { data: demandas } = await supabase
        .from('demandas')
        .select('endereco_bairro, endereco_regional');

      // Filtrar apenas itens que têm endereço (bairro ou regional)
      const allItems = [...(solicitacoes || []), ...(demandas || [])]
        .filter(item => item.endereco_bairro || item.endereco_regional);
      
      // Filtrar itens da regional específica
      const itensRegional = allItems.filter(item => {
        let regionalId = item.endereco_regional;
        
        // Se não tiver regional, calcula pelo bairro
        if (!regionalId && item.endereco_bairro) {
          regionalId = encontrarRegionalPorBairro(item.endereco_bairro).toString();
        }
        
        const regionalDoItem = getRegionalPorId(parseInt(regionalId));
        const regionalDoItemNome = regionalDoItem?.nome || 'Não definido';
        return regionalDoItemNome === regional;
      });

      // Agrupar por bairro
      const grouped = itensRegional.reduce((acc, item) => {
        const bairro = item.endereco_bairro || 'Não definido';
        if (!acc[bairro]) acc[bairro] = 0;
        acc[bairro]++;
        return acc;
      }, {} as Record<string, number>);

      const result = Object.entries(grouped).map(([bairro, value]) => ({
        bairro,
        quantidade: value
      })).sort((a, b) => b.quantidade - a.quantidade);

      return result;
    } catch (error) {
      Logger.error('Erro ao buscar bairros', { error }, 'useDashboardCharts', false);
      return [];
    }
  };

  // 10. Buscar itens por bairro
  const fetchItensPorBairro = async (bairro: string): Promise<any[]> => {
    try {
      const { data: solicitacoes } = await supabase
        .from('solicitacoes')
        .select('*')
        .eq('endereco_bairro', bairro);

      const { data: demandas } = await supabase
        .from('demandas')
        .select('*')
        .eq('endereco_bairro', bairro);

      const allItems = [...(solicitacoes || []), ...(demandas || [])];
      
      // Ordenar por data de criação (mais recentes primeiro)
      return allItems.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } catch (error) {
      Logger.error('Erro ao buscar itens do bairro', { error }, 'useDashboardCharts', false);
      return [];
    }
  };

  // Função principal para buscar todos os dados
  const fetchAllChartsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [
        evolutionResult,
        backlogResult,
        averageTimeResult,
        funnelResult,
        topPerformersResult,
        regionalResult,
        scatterResult,
        regionaisMaisDemandasResult
      ] = await Promise.allSettled([
        fetchEvolutionData(),
        fetchBacklogData(),
        fetchAverageTimeData(),
        fetchFunnelData(),
        fetchTopPerformersData(),
        fetchRegionalData(),
        fetchScatterData(),
        fetchRegionaisMaisDemandas()
      ]);

      // Processar resultados
      setEvolutionData(evolutionResult.status === 'fulfilled' ? evolutionResult.value : []);
      setBacklogData(backlogResult.status === 'fulfilled' ? backlogResult.value : []);
      setAverageTimeData(averageTimeResult.status === 'fulfilled' ? averageTimeResult.value : []);
      setFunnelData(funnelResult.status === 'fulfilled' ? funnelResult.value : []);
      setTopPerformersData(topPerformersResult.status === 'fulfilled' ? topPerformersResult.value : []);
      setRegionalData(regionalResult.status === 'fulfilled' ? regionalResult.value : []);
      setScatterData(scatterResult.status === 'fulfilled' ? scatterResult.value : []);
      setRegionaisMaisDemandas(regionaisMaisDemandasResult.status === 'fulfilled' ? regionaisMaisDemandasResult.value : []);

    } catch (err) {
      Logger.error('Erro ao buscar dados dos gráficos', { err }, 'useDashboardCharts', false);
      setError('Erro ao carregar dados dos gráficos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllChartsData();
  }, []);

  return {
    loading,
    error,
    data: {
      evolutionData,
      backlogData,
      averageTimeData,
      funnelData,
      topPerformersData,
      regionalData,
      scatterData,
      regionaisMaisDemandas,
      fetchBairrosPorRegional,
      fetchItensPorBairro
    },
    refetch: fetchAllChartsData
  };
}
