import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { MapaFilters, MapaItem, MapaStats } from '../types';
import { GeocodingService } from '../services/geocoding';
import { formatarResponsavel, Profile } from '../utils/responsavelUtils';
import { verificarAtraso } from '../utils/calculoDiasUteis';
import Logger from '../utils/logger';

export function useMapaDataSimple(filters: MapaFilters) {
  const [dados, setDados] = useState<MapaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [stats, setStats] = useState<MapaStats>({
    total: 0,
    comCoordenadas: 0,
    semCoordenadas: 0,
    porRegional: {},
    porStatus: {},
    atrasados: 0,
    ultimoUpdate: new Date()
  });

  // Carregar profiles para nomes de responsáveis
  useEffect(() => {
    const carregarProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .order('full_name');
        
        if (error) throw error;
        setProfiles((data || []).map(p => ({
          id: p.id,
          email: p.email,
          full_name: p.full_name,
          role: 'user' as const,
          created_at: new Date().toISOString()
        })));
      } catch (error) {
        Logger.error('Erro ao carregar profiles', { error }, 'useMapaDataSimple');
      }
    };
    
    carregarProfiles();
  }, []);

  // Função super simples - busca direto das tabelas
  const fetchDadosSimples = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Esperar profiles carregarem
    if (profiles.length === 0) {
      return;
    }

    try {
      // Buscar diretamente das tabelas (só colunas que existem)
      const { data: solicitacoes, error: errorSol } = await supabase
        .from('solicitacoes')
        .select(`
          id, assunto, protocolo, status, created_at, data_inicio, 
          data_contato, data_finalizado, observacoes, user_id,
          responsavel, ponto_contato,
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
          responsavel, ponto_contato,
          endereco_rua, endereco_numero, endereco_bairro, endereco_localidade,
          endereco_cep, endereco_complemento, endereco_latitude, endereco_longitude,
          profiles!inner (full_name, email)
        `)
        .limit(50);

      if (errorDem) {
        throw errorDem;
      }

      // Transformar dados para o formato esperado
      const transformarSolicitacao = (item: any): MapaItem => {
        const possuiCoords = item.endereco_latitude && item.endereco_longitude;
        
        // Calcular regional baseada no bairro
        const regionalText = GeocodingService.buscarRegionalPorBairro(item.endereco_bairro || '');
        const regionalNumber = GeocodingService.extrairNumeroRegional(regionalText);
        
        // Calcular dias de atraso
        const diasAtraso = verificarAtraso(item.status || '', item.data_contato);
        
        return {
          id: item.id,
          assunto: item.assunto || 'Sem assunto',
          protocolo: item.protocolo || 'N/A',
          status: item.status || 'desconhecido',
          tipo: 'solicitacao' as const,
          latitude: item.endereco_latitude,
          longitude: item.endereco_longitude,
          possui_coordenadas: !!possuiCoords,
          responsavel: formatarResponsavel(item.responsavel, profiles),
          ponto_contato: item.ponto_contato || '',
          created_at: item.created_at || new Date().toISOString(),
          data_inicio: item.data_inicio,
          data_contato: item.data_contato,
          data_finalizado: item.data_finalizado,
          user_id: item.user_id,
          updated_at: item.updated_at,
          endereco_rua: item.endereco_rua || '',
          endereco_numero: item.endereco_numero || '',
          endereco_bairro: item.endereco_bairro || '',
          endereco_localidade: item.endereco_localidade || '',
          endereco_cep: item.endereco_cep || '',
          endereco_complemento: item.endereco_complemento || '',
          endereco_cidade: item.endereco_localidade || 'Fortaleza',
          endereco_uf: 'CE',
          endereco_regional: regionalNumber,
          endereco_geocoding_status: possuiCoords ? 'sucesso' : 'pendente',
          usuario_nome: item.profiles?.full_name || 'Anônimo',
          usuario_email: item.profiles?.email || '',
          atrasado: diasAtraso > 0,
          dias_atraso: diasAtraso
        };
      };

      const transformarDemanda = (item: any): MapaItem => {
        const possuiCoords = item.endereco_latitude && item.endereco_longitude;
        
        // Calcular regional baseada no bairro
        const regionalText = GeocodingService.buscarRegionalPorBairro(item.endereco_bairro || '');
        const regionalNumber = GeocodingService.extrairNumeroRegional(regionalText);
        
        // Calcular dias de atraso
        const diasAtraso = verificarAtraso(item.status || '', item.data_contato);
        
        return {
          id: item.id,
          assunto: item.assunto || 'Sem assunto',
          protocolo: item.protocolo || 'N/A',
          status: item.status || 'desconhecido',
          tipo: 'demanda' as const,
          latitude: item.endereco_latitude,
          longitude: item.endereco_longitude,
          possui_coordenadas: !!possuiCoords,
          responsavel: formatarResponsavel(item.responsavel, profiles),
          ponto_contato: item.ponto_contato || '',
          created_at: item.created_at || new Date().toISOString(),
          data_inicio: item.data_inicio,
          data_contato: item.data_contato,
          data_finalizado: item.data_finalizado,
          user_id: item.user_id,
          updated_at: item.updated_at,
          endereco_rua: item.endereco_rua || '',
          endereco_numero: item.endereco_numero || '',
          endereco_bairro: item.endereco_bairro || '',
          endereco_localidade: item.endereco_localidade || '',
          endereco_cep: item.endereco_cep || '',
          endereco_complemento: item.endereco_complemento || '',
          endereco_cidade: item.endereco_localidade || 'Fortaleza',
          endereco_uf: 'CE',
          endereco_regional: regionalNumber,
          endereco_geocoding_status: possuiCoords ? 'sucesso' : 'pendente',
          usuario_nome: item.profiles?.full_name || 'Anônimo',
          usuario_email: item.profiles?.email || '',
          atrasado: diasAtraso > 0,
          dias_atraso: diasAtraso
        };
      };

      const solicitacoesFormatadas = (solicitacoes || []).map(item => transformarSolicitacao(item));
      const demandasFormatadas = (demandas || []).map(item => transformarDemanda(item));

      const todosDados = [...solicitacoesFormatadas, ...demandasFormatadas];
      
      // Aplicar filtros - ordem otimizada
      let dadosFiltrados = todosDados;
      
      // 1. Filtro de itens atrasados (prioridade máxima)
      if (filters.apenasAtrasados) {
        dadosFiltrados = dadosFiltrados.filter(d => d.atrasado);
      }
      
      // 2. Filtro de status
      if (filters.status && filters.status.length > 0) {
        dadosFiltrados = dadosFiltrados.filter(d => filters.status.includes(d.status));
      }
      
      // 3. Filtro de tipo
      if (filters.tipo && filters.tipo !== '') {
        if (filters.tipo === 'solicitacao') {
          dadosFiltrados = dadosFiltrados.filter(d => d.tipo === 'solicitacao');
        } else if (filters.tipo === 'demanda') {
          dadosFiltrados = dadosFiltrados.filter(d => d.tipo === 'demanda');
        }
      }
      
      // 4. Filtro de período
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
      
      // 5. Filtro de regional
      if (filters.regional && filters.regional > 0) {
        dadosFiltrados = dadosFiltrados.filter(d => d.endereco_regional === filters.regional);
      }
      
      // 6. Filtro de ordenação
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
      
      // 7. Filtro de coordenadas (último)
      if (filters.apenasComCoordenadas) {
        dadosFiltrados = dadosFiltrados.filter(d => d.possui_coordenadas);
      }
      
      setDados(dadosFiltrados);

      // Calcular estatísticas centralizadas
      const statsCalculadas: MapaStats = {
        total: dadosFiltrados.length,
        comCoordenadas: dadosFiltrados.filter(d => d.possui_coordenadas).length,
        semCoordenadas: dadosFiltrados.filter(d => !d.possui_coordenadas).length,
        porRegional: dadosFiltrados.reduce((acc, item) => {
          const regional = item.endereco_regional || 0;
          acc[regional] = (acc[regional] || 0) + 1;
          return acc;
        }, {} as Record<number, number>),
        porStatus: dadosFiltrados.reduce((acc, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        atrasados: dadosFiltrados.filter(d => d.atrasado).length,
        ultimoUpdate: new Date()
      };

      setStats(statsCalculadas);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [filters, profiles]);

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
    geocodificarEndereco: async () => {
      // Geocoding não implementado na versão simples
    }
  };
}
