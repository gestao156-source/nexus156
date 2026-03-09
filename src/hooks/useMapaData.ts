import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { GeocodingService } from '../services/geocoding';
import { RegionalizacaoService } from '../utils/regionalizacaoDinamica';
import { MapaFilters, MapaItem, MapaStats } from '../types';

export function useMapaData(initialFilters: MapaFilters) {
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

  // Estados para bounding box e limitador
  const [mapBounds, setMapBounds] = useState<{
    north: number; south: number; east: number; west: number;
  } | null>(null);
  const [pinsLimitados, setPinsLimitados] = useState(false);
  const [totalDisponiveis, setTotalDisponiveis] = useState(0);

  const subscriptionRef = useRef<any>(null);
  const geocodingQueueRef = useRef<Set<string>>(new Set());
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Função de geocoding com retry
  const geocodificarEndereco = useCallback(async (item: MapaItem): Promise<void> => {
    if (item.endereco_geocoding_status === 'sucesso' || 
        geocodingQueueRef.current.has(item.id)) {
      return;
    }

    geocodingQueueRef.current.add(item.id);

    try {
      const enderecoCompleto = [
        item.endereco_rua,
        item.endereco_numero,
        item.endereco_bairro,
        item.endereco_cidade,
        item.endereco_uf,
        item.endereco_cep
      ].filter(Boolean).join(', ');

      // Rate limiting: 1 requisição por segundo
      await new Promise(resolve => setTimeout(resolve, 1000));

      const coords = await GeocodingService.buscarCoordenadas(enderecoCompleto);
      
      if (coords) {
        const tabela = item.tipo === 'solicitacao' ? 'solicitacoes' : 'demandas';
        await supabase
          .from(tabela)
          .update({
            endereco_latitude: coords.lat,
            endereco_longitude: coords.lng,
            endereco_geocoding_status: 'sucesso',
            endereco_regional: RegionalizacaoService.determinarRegional(item.endereco_bairro || ''),
            endereco_validado: true,
            endereco_geocoding_last_attempt: new Date().toISOString()
          })
          .eq('id', item.id);
      } else {
        const tabela = item.tipo === 'solicitacao' ? 'solicitacoes' : 'demandas';
        await supabase
          .from(tabela)
          .update({ 
            endereco_geocoding_status: 'falha',
            endereco_geocoding_last_attempt: new Date().toISOString()
          })
          .eq('id', item.id);
      }
    } catch (error) {
      console.error(`Erro geocodificando ${item.id}:`, error);
    } finally {
      geocodingQueueRef.current.delete(item.id);
    }
  }, []);

  // Detectar quando o mapa move
  const handleMapMove = useCallback((bounds: any) => {
    setMapBounds({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    });
  }, []);

  // Buscar com bounding box e limite de 300 pins
  const fetchDadosBoundingBox = useCallback(async () => {
    if (!mapBounds) return;

    setLoading(true);
    setError(null);

    try {
      // Buscar dados com bounding box
      const { data, error } = await supabase.rpc('buscar_solicitacoes_bbox', {
        p_north: mapBounds.north,
        p_south: mapBounds.south,
        p_east: mapBounds.east,
        p_west: mapBounds.west,
        p_status: initialFilters.status.length > 0 ? initialFilters.status : null,
        p_tipo: initialFilters.tipo !== 'todos' ? initialFilters.tipo : null,
        p_regional: initialFilters.regional > 0 ? initialFilters.regional : null,
        p_limit: 300 // LIMITE HARD
      });

      if (error) throw error;

      // Contar total disponível
      const { count, error: countError } = await supabase.rpc('contar_solicitacoes_bbox', {
        p_north: mapBounds.north,
        p_south: mapBounds.south,
        p_east: mapBounds.east,
        p_west: mapBounds.west,
        p_status: initialFilters.status.length > 0 ? initialFilters.status : null,
        p_tipo: initialFilters.tipo !== 'todos' ? initialFilters.tipo : null,
        p_regional: initialFilters.regional > 0 ? initialFilters.regional : null
      });

      if (countError) throw countError;

      const novosDados = data || [];
      setDados(novosDados);

      // Verificar se atingiu limite
      if (count && count > 300) {
        setPinsLimitados(true);
        setTotalDisponiveis(count);
      } else {
        setPinsLimitados(false);
        setTotalDisponiveis(count || 0);
      }

      // Calcular estatísticas
      const statsCalculadas: MapaStats = {
        total: novosDados.length,
        comCoordenadas: novosDados.filter((d: any) => d.possui_coordenadas).length,
        semCoordenadas: novosDados.filter((d: any) => !d.possui_coordenadas).length,
        porRegional: novosDados.reduce((acc: Record<number, number>, item: any) => {
          acc[item.endereco_regional] = (acc[item.endereco_regional] || 0) + 1;
          return acc;
        }, {} as Record<number, number>),
        porStatus: novosDados.reduce((acc: Record<string, number>, item: any) => {
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
  }, [mapBounds, initialFilters]);

  // Busca paginada tradicional (fallback)
  const fetchDadosPaginado = useCallback(async (offset = 0) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.rpc('get_mapa_dados_paginado', {
        p_status: initialFilters.status.length > 0 ? initialFilters.status : null,
        p_tipo: initialFilters.tipo !== 'todos' ? initialFilters.tipo : null,
        p_regional: initialFilters.regional > 0 ? initialFilters.regional : null,
        p_data_inicio: initialFilters.periodo.inicio,
        p_data_fim: initialFilters.periodo.fim,
        p_limit: 100,
        p_offset: offset,
        p_ordenar_por: initialFilters.ordenarPor,
        p_ordem: initialFilters.ordem
      });

      if (error) throw error;

      const novosDados = data || [];
      setDados(prev => offset === 0 ? novosDados : [...prev, ...novosDados]);

      // Calcular estatísticas
      const statsCalculadas: MapaStats = {
        total: novosDados.length,
        comCoordenadas: novosDados.filter((d: any) => d.possui_coordenadas).length,
        semCoordenadas: novosDados.filter((d: any) => !d.possui_coordenadas).length,
        porRegional: novosDados.reduce((acc: Record<number, number>, item: any) => {
          acc[item.endereco_regional] = (acc[item.endereco_regional] || 0) + 1;
          return acc;
        }, {} as Record<number, number>),
        porStatus: novosDados.reduce((acc: Record<string, number>, item: any) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        ultimoUpdate: new Date()
      };
      setStats(statsCalculadas);

      // Geocodificar em lote (limitado para não sobrecarregar)
      const itensSemCoordenadas = novosDados.filter((d: any) => 
        !d.possui_coordenadas && 
        d.endereco_geocoding_status === 'pendente'
      ).slice(0, 5);

      if (itensSemCoordenadas.length > 0) {
        await Promise.allSettled(
          itensSemCoordenadas.map((item: any) => geocodificarEndereco(item))
        );
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [initialFilters, geocodificarEndereco]);

  // Debounce para realtime
  const debouncedFetch = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      if (mapBounds) {
        fetchDadosBoundingBox();
      } else {
        fetchDadosPaginado();
      }
    }, 1500); // 1.5 segundos de debounce
  }, [fetchDadosBoundingBox, fetchDadosPaginado, mapBounds]);

  // Subscription com reconexão automática e debounce
  useEffect(() => {
    const setupSubscription = () => {
      const channel = supabase
        .channel('mapa_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'solicitacoes' },
          (payload: any) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              debouncedFetch(); // Debounce em vez de fetch direto
            }
          }
        )
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'demandas' },
          (payload: any) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              debouncedFetch(); // Debounce em vez de fetch direto
            }
          }
        )
        .subscribe();

      return channel;
    };

    // Reconexão automática se desconectar
    const handleReconnect = () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
      setTimeout(() => {
        subscriptionRef.current = setupSubscription();
      }, 5000);
    };

    // Subscribe e configurar handlers
    const channel = setupSubscription();
    subscriptionRef.current = channel;

    // Configurar handler de reconexão
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Mapa realtime conectado');
      } else if (status === 'CLOSED') {
        console.log('Mapa realtime desconectado, tentando reconectar...');
        handleReconnect();
      }
    });

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [debouncedFetch]);

  // Carregar dados iniciais
  useEffect(() => {
    if (mapBounds) {
      fetchDadosBoundingBox();
    } else {
      fetchDadosPaginado();
    }
  }, [fetchDadosBoundingBox, fetchDadosPaginado, mapBounds]);

  return {
    dados,
    loading,
    error,
    stats,
    pinsLimitados,
    totalDisponiveis,
    handleMapMove,
    refetch: () => {
      if (mapBounds) {
        fetchDadosBoundingBox();
      } else {
        fetchDadosPaginado();
      }
    },
    carregarMais: () => fetchDadosPaginado(dados.length),
    geocodificarEndereco
  };
}
