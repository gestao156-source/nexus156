import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { MapaFilters, MapaItem, MapaStats } from '../types';
import { GeocodingService } from '../services/geocoding';

export function useMapaDataSimple(filters: MapaFilters) {
  const [dados, setDados] = useState<MapaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<MapaStats>({
    total: 0,
    comCoordenadas: 0,
    semCoordenadas: 0,
    porRegional: {},
    porStatus: {},
    ultimoUpdate: new Date()
  });

  // Função super simples - busca direto das tabelas
  const fetchDadosSimples = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Buscar diretamente das tabelas (só colunas que existem)
      const { data: solicitacoes, error: errorSol } = await supabase
        .from('solicitacoes')
        .select(`
          id, assunto, protocolo, status, created_at, data_inicio, 
          data_contato, data_finalizado, observacoes, user_id,
          endereco_rua, endereco_numero, endereco_bairro, endereco_localidade,
          endereco_cep, endereco_complemento, endereco_latitude, endereco_longitude,
          profiles!inner (full_name, email)
        `)
        .limit(50);

      if (errorSol) {
        throw errorSol;
      }

      // Buscar demandas
      const { data: demandas, error: errorDem } = await supabase
        .from('demandas')
        .select(`
          id, assunto, protocolo, status, created_at, data_inicio, 
          data_contato, data_finalizado, observacoes, user_id,
          endereco_rua, endereco_numero, endereco_bairro, endereco_localidade,
          endereco_cep, endereco_complemento, endereco_latitude, endereco_longitude,
          profiles!inner (full_name, email)
        `)
        .limit(50);

      if (errorDem) {
        throw errorDem;
      }

      // Transformar dados para o formato esperado
      const transformarItem = (item: any, tipo: 'solicitacao' | 'demanda'): MapaItem => {
        const possuiCoords = item.endereco_latitude && item.endereco_longitude;
        
        // Calcular regional baseada no bairro
        const regionalText = GeocodingService.buscarRegionalPorBairro(item.endereco_bairro || '');
        const regionalNumber = GeocodingService.extrairNumeroRegional(regionalText);
        
        return {
          id: item.id,
          assunto: item.assunto || 'Sem assunto',
          protocolo: item.protocolo || 'N/A',
          status: item.status || 'desconhecido',
          responsavel: 'Não definido', // Campo não existe na tabela original
          ponto_contato: '', // Campo não existe na tabela original
          created_at: item.created_at || new Date().toISOString(),
          data_inicio: item.data_inicio,
          data_contato: item.data_contato,
          data_finalizado: item.data_finalizado,
          endereco_rua: item.endereco_rua || '',
          endereco_numero: item.endereco_numero || '',
          endereco_bairro: item.endereco_bairro || '',
          endereco_complemento: item.endereco_complemento || '',
          endereco_cep: item.endereco_cep || '',
          endereco_cidade: item.endereco_localidade || 'Fortaleza',
          endereco_uf: 'CE',
          endereco_latitude: item.endereco_latitude,
          endereco_longitude: item.endereco_longitude,
          endereco_regional: regionalNumber,
          endereco_geocoding_status: possuiCoords ? 'sucesso' : 'pendente',
          endereco_validado: possuiCoords,
          possui_coordenadas: possuiCoords,
          usuario_nome: item.profiles?.full_name || 'Anônimo',
          usuario_email: item.profiles?.email || ''
        };
      };

      const solicitacoesFormatadas = (solicitacoes || []).map(item => transformarItem(item, 'solicitacao'));
      const demandasFormatadas = (demandas || []).map(item => transformarItem(item, 'demanda'));

      const todosDados = [...solicitacoesFormatadas, ...demandasFormatadas];
      
      console.log('🔍 Dados totais:', todosDados.length);
      console.log('📍 Com coordenadas:', todosDados.filter(d => d.possui_coordenadas).length);
      console.log('❌ Sem coordenadas:', todosDados.filter(d => !d.possui_coordenadas).length);
      
      // Aplicar filtros
      let dadosFiltrados = todosDados;
      
      // Filtro de status
      if (filters.status && filters.status.length > 0) {
        dadosFiltrados = dadosFiltrados.filter(d => filters.status.includes(d.status));
      }
      
      // Filtro de tipo
      if (filters.tipo && filters.tipo !== '') {
        if (filters.tipo === 'solicitacao') {
          dadosFiltrados = dadosFiltrados.filter(d => d.tipo === 'solicitacao');
        } else if (filters.tipo === 'demanda') {
          dadosFiltrados = dadosFiltrados.filter(d => d.tipo === 'demanda');
        }
        // 'todos' não filtra nada
      }
      
      // Filtro de período
      if (filters.periodo) {
        const dataInicio = filters.periodo.inicio;
        const dataFim = filters.periodo.fim;
        
        if (dataInicio && dataFim) {
          dadosFiltrados = dadosFiltrados.filter(d => {
            const dataItem = new Date(d.created_at);
            return dataItem >= dataInicio && dataItem <= dataFim;
          });
        }
      }
      
      // Filtro de regional
      if (filters.regional && filters.regional > 0) {
        dadosFiltrados = dadosFiltrados.filter(d => d.endereco_regional === filters.regional);
      }
      
      // Filtro de ordenação
      if (filters.ordenarPor) {
        dadosFiltrados.sort((a, b) => {
          let valorA: any, valorB: any;
          
          switch (filters.ordenarPor) {
            case 'created_at':
              valorA = new Date(a.created_at);
              valorB = new Date(b.created_at);
              break;
            case 'protocolo':
              valorA = a.protocolo || '';
              valorB = b.protocolo || '';
              break;
            case 'assunto':
              valorA = a.assunto || '';
              valorB = b.assunto || '';
              break;
            default:
              valorA = a.created_at;
              valorB = b.created_at;
          }
          
          if (filters.ordem === 'DESC') {
            return valorB > valorA ? 1 : valorB < valorA ? -1 : 0;
          } else {
            return valorA > valorB ? 1 : valorA < valorB ? -1 : 0;
          }
        });
      }
      
      // Aplicar filtro de coordenadas se necessário
      if (filters.apenasComCoordenadas) {
        dadosFiltrados = dadosFiltrados.filter(d => d.possui_coordenadas);
      }
      
      console.log('🗺️ Dados para o mapa (filtrados):', dadosFiltrados.length);
      console.log('📍 Itens com coordenadas:', dadosFiltrados.map(d => ({
        id: d.id,
        tipo: d.tipo,
        possui_coordenadas: d.possui_coordenadas,
        lat: d.endereco_latitude,
        lng: d.endereco_longitude
      })));
      
      setDados(dadosFiltrados);

      // Calcular estatísticas (baseado nos dados totais, não filtrados)
      const statsCalculadas: MapaStats = {
        total: todosDados.length,
        comCoordenadas: todosDados.filter(d => d.possui_coordenadas).length,
        semCoordenadas: todosDados.filter(d => !d.possui_coordenadas).length,
        porRegional: todosDados.reduce((acc, item) => {
          acc[item.endereco_regional] = (acc[item.endereco_regional] || 0) + 1;
          return acc;
        }, {} as Record<number, number>),
        porStatus: todosDados.reduce((acc, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        ultimoUpdate: new Date()
      };

      setStats(statsCalculadas);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Carregar dados iniciais
  useEffect(() => {
    fetchDadosSimples();
  }, [fetchDadosSimples]);

  return {
    dados,
    loading,
    error,
    stats,
    refetch: fetchDadosSimples,
    carregarMais: () => fetchDadosSimples(),
    geocodificarEndereco: async (item: MapaItem) => {
      // Geocoding não implementado na versão simples
    }
  };
}
