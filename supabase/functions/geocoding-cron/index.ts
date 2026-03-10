import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configuração CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Criar cliente Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Interfaces
interface EnderecoPendente {
  id: string;
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_uf?: string;
  endereco_cep?: string;
  tipo: 'solicitacao' | 'demanda';
}

interface Coordenadas {
  lat: number;
  lng: number;
}

interface CacheEntry {
  endereco_hash: string;
  latitude: number;
  longitude: number;
  provider: string;
}

// Serviço de Geocoding
class GeocodingService {
  private static readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
  private static readonly RATE_LIMIT_MS = 1000; // 1 segundo entre requisições
  private static lastRequestTime = 0;

  /**
   * Busca coordenadas via Nominatim com rate limiting
   */
  static async buscarCoordenadas(endereco: string): Promise<Coordenadas | null> {
    try {
      // Rate limiting
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.RATE_LIMIT_MS) {
        await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_MS - timeSinceLastRequest));
      }

      this.lastRequestTime = Date.now();

      // Fazer requisição para Nominatim
      const url = `${this.NOMINATIM_URL}?format=json&q=${encodeURIComponent(endereco)}&limit=1&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Nexus156-Geocoding/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.length === 0) {
        return null;
      }

      const result = data[0];
      
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon)
      };

    } catch (error) {
      console.error('Erro ao buscar coordenadas:', error);
      throw error;
    }
  }
}

// Serviço de Cache
class GeocodingCache {
  /**
   * Busca cache pelo hash
   */
  static async buscar(hash: string): Promise<CacheEntry | null> {
    try {
      const { data, error } = await supabase
        .from('geocoding_cache')
        .select('*')
        .eq('endereco_hash', hash)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found
          return null;
        }
        throw error;
      }

      // Verificar se cache expirou
      if (data.expires_at < new Date().toISOString()) {
        // Cache expirado, remover e retornar null
        await this.remover(hash);
        return null;
      }

      // Atualizar contador de uso
      await this.atualizarUso(hash);

      return {
        endereco_hash: data.endereco_hash,
        latitude: data.latitude,
        longitude: data.longitude,
        provider: data.provider
      };

    } catch (error) {
      console.error('Erro ao buscar cache:', error);
      return null;
    }
  }

  /**
   * Salva no cache
   */
  static async salvar(hash: string, endereco: string, coords: Coordenadas, provider: string = 'nominatim'): Promise<void> {
    try {
      await supabase
        .from('geocoding_cache')
        .upsert({
          endereco_hash: hash,
          endereco_completo: endereco,
          latitude: coords.lat,
          longitude: coords.lng,
          provider,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
          usage_count: 1,
          last_used_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Erro ao salvar cache:', error);
      throw error;
    }
  }

  /**
   * Remove entrada do cache
   */
  static async remover(hash: string): Promise<void> {
    try {
      await supabase
        .from('geocoding_cache')
        .delete()
        .eq('endereco_hash', hash);
    } catch (error) {
      console.error('Erro ao remover cache:', error);
      // Não lançar erro para não interromper o fluxo
    }
  }

  /**
   * Atualiza contador de uso
   */
  static async atualizarUso(hash: string): Promise<void> {
    try {
      await supabase
        .from('geocoding_cache')
        .update({
          usage_count: supabase.rpc('increment_usage_count'),
          last_used_at: new Date().toISOString()
        })
        .eq('endereco_hash', hash);
    } catch (error) {
      console.error('Erro ao atualizar uso do cache:', error);
      // Não lançar erro para não interromper o fluxo
    }
  }
}

// Serviço de Processamento
class ProcessadorGeocoding {
  /**
   * Busca endereços pendentes
   */
  static async buscarPendentes(): Promise<EnderecoPendente[]> {
    try {
      // Buscar solicitacoes pendentes
      const { data: solicitacoes, error: errorSol } = await supabase
        .from('solicitacoes')
        .select('id, endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, endereco_uf, endereco_cep')
        .eq('endereco_geocoding_status', 'pendente')
        .limit(25);

      if (errorSol) throw errorSol;

      // Buscar demandas pendentes
      const { data: demandas, error: errorDem } = await supabase
        .from('demandas')
        .select('id, endereco_rua, endereco_numero, endereco_bairro, endereco_cidade, endereco_uf, endereco_cep')
        .eq('endereco_geocoding_status', 'pendente')
        .limit(25);

      if (errorDem) throw errorDem;

      // Combinar resultados
      const solicitacoesComTipo = (solicitacoes || []).map(item => ({ ...item, tipo: 'solicitacao' as const }));
      const demandasComTipo = (demandas || []).map(item => ({ ...item, tipo: 'demanda' as const }));

      return [...solicitacoesComTipo, ...demandasComTipo];

    } catch (error) {
      console.error('Erro ao buscar pendentes:', error);
      return [];
    }
  }

  /**
   * Salva coordenadas no banco
   */
  static async salvarCoordenadas(id: string, tipo: 'solicitacao' | 'demanda', coords: Coordenadas, provider: string): Promise<void> {
    try {
      const tabela = tipo === 'solicitacao' ? 'solicitacoes' : 'demandas';
      
      await supabase
        .from(tabela)
        .update({
          endereco_latitude: coords.lat,
          endereco_longitude: coords.lng,
          endereco_geocoding_status: 'sucesso',
          endereco_geocoding_provider: provider,
          endereco_validado: true,
          endereco_geocoding_last_attempt: new Date().toISOString()
        })
        .eq('id', id);

    } catch (error) {
      console.error('Erro ao salvar coordenadas:', error);
      throw error;
    }
  }

  /**
   * Marca como falha
   */
  static async marcarComoFalha(id: string, tipo: 'solicitacao' | 'demanda', erro: string): Promise<void> {
    try {
      const tabela = tipo === 'solicitacao' ? 'solicitacoes' : 'demandas';
      
      await supabase
        .from(tabela)
        .update({
          endereco_geocoding_status: 'falha',
          endereco_geocoding_last_attempt: new Date().toISOString()
        })
        .eq('id', id);

    } catch (error) {
      console.error('Erro ao marcar como falha:', error);
      // Não lançar erro para não interromper o fluxo
    }
  }

  /**
   * Processa um endereço
   */
  static async processarEndereco(endereco: EnderecoPendente): Promise<void> {
    try {
      // Construir endereço completo
      const enderecoCompleto = [
        endereco.endereco_rua,
        endereco.endereco_numero,
        endereco.endereco_bairro,
        endereco.endereco_cidade || 'Fortaleza',
        endereco.endereco_uf || 'CE',
        endereco.endereco_cep
      ].filter(Boolean).join(', ');

      // Gerar hash
      const hash = await this.gerarHash(endereco);

      // Verificar cache
      const cache = await GeocodingCache.buscar(hash);
      
      if (cache) {
        await this.salvarCoordenadas(endereco.id, endereco.tipo, {
          lat: cache.latitude,
          lng: cache.longitude
        }, cache.provider);
        return;
      }

      // Geocoding
      const coords = await GeocodingService.buscarCoordenadas(enderecoCompleto);
      
      if (coords) {
        await this.salvarCoordenadas(endereco.id, endereco.tipo, coords, 'nominatim');
        await GeocodingCache.salvar(hash, enderecoCompleto, coords);
      } else {
        await this.marcarComoFalha(endereco.id, endereco.tipo, 'Endereço não encontrado');
      }

    } catch (error) {
      await this.marcarComoFalha(endereco.id, endereco.tipo, error.message);
    }
  }

  /**
   * Gera hash do endereço
   */
  private static async gerarHash(endereco: EnderecoPendente): Promise<string> {
    const normalizado = [
      endereco.endereco_rua || '',
      endereco.endereco_numero || '',
      endereco.endereco_bairro || '',
      endereco.endereco_cidade || 'Fortaleza',
      endereco.endereco_uf || 'CE',
      endereco.endereco_cep || ''
    ]
      .join(',')
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s,-]/g, '');

    const encoder = new TextEncoder();
    const data = encoder.encode(normalizado);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

// Handler principal
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Iniciando processamento de geocoding...');

    // Buscar endereços pendentes
    const pendentes = await ProcessadorGeocoding.buscarPendentes();
    console.log(`📋 Encontrados ${pendentes.length} endereços pendentes`);

    let processados = 0;
    let sucesso = 0;
    let falha = 0;

    // Processar cada endereço
    for (const endereco of pendentes) {
      try {
        await ProcessadorGeocoding.processarEndereco(endereco);
        processados++;
        sucesso++;
        console.log(`✅ Processado: ${endereco.id} (${endereco.tipo})`);
      } catch (error) {
        processados++;
        falha++;
        console.error(`❌ Falha: ${endereco.id} - ${error.message}`);
      }

      // Rate limiting entre requisições
      if (pendentes.indexOf(endereco) < pendentes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const resultado = {
      processados,
      sucesso,
      falha,
      tempo: new Date().toISOString()
    };

    console.log(`🎯 Processamento concluído: ${sucesso} sucesso, ${falha} falhas`);

    return new Response(
      JSON.stringify(resultado),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('💥 Erro no processamento:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
