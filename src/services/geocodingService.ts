import { supabase } from '../lib/supabase';
import { encontrarRegionalPorBairro } from '../utils/regionalUtils';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  regional: number;
  status: 'sucesso' | 'falha' | 'pendente';
}

/**
 * Geocodifica um endereço completo
 */
export async function geocodificarEndereco(
  rua: string,
  numero: string,
  bairro: string,
  cidade: string = 'Fortaleza',
  uf: string = 'CE'
): Promise<GeocodingResult> {
  try {
    // Construir endereço completo
    const enderecoCompleto = `${rua}, ${numero}, ${bairro}, ${cidade}, ${uf}`;
    
    // Chamar API de geocoding (usando Nominatim do OpenStreetMap)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoCompleto)}&limit=1`,
      {
        headers: {
          'User-Agent': 'Nexus156-Geocoding/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Erro na API de geocoding');
    }
    
    const dados = await response.json();
    
    if (dados.length === 0) {
      return {
        latitude: 0,
        longitude: 0,
        regional: encontrarRegionalPorBairro(bairro),
        status: 'falha'
      };
    }
    
    const resultado = dados[0];
    const latitude = parseFloat(resultado.lat);
    const longitude = parseFloat(resultado.lon);
    
    // Encontrar regional baseada no bairro
    const regional = encontrarRegionalPorBairro(bairro);
    
    return {
      latitude,
      longitude,
      regional,
      status: 'sucesso'
    };
    
  } catch (error) {
    console.error('Erro no geocoding:', error);
    
    // Mesmo com erro, tentar encontrar regional pelo bairro
    return {
      latitude: 0,
      longitude: 0,
      regional: encontrarRegionalPorBairro(bairro),
      status: 'falha'
    };
  }
}

/**
 * Atualiza coordenadas e regional de uma solicitação
 */
export async function atualizarCoordenadasSolicitacao(
  id: string,
  rua: string,
  numero: string,
  bairro: string
): Promise<void> {
  const resultado = await geocodificarEndereco(rua, numero, bairro);
  
  const updateData = {
    endereco_rua: rua,
    endereco_numero: numero,
    endereco_bairro: bairro,
    endereco_latitude: resultado.latitude,
    endereco_longitude: resultado.longitude
  };
  
  const { error } = await supabase
    .from('solicitacoes')
    .update(updateData)
    .eq('id', id);
    
  if (error) {
    throw error;
  }
}

/**
 * Atualiza coordenadas e regional de uma demanda
 */
export async function atualizarCoordenadasDemanda(
  id: string,
  rua: string,
  numero: string,
  bairro: string
): Promise<void> {
  const resultado = await geocodificarEndereco(rua, numero, bairro);
  
  const updateData = {
    endereco_rua: rua,
    endereco_numero: numero,
    endereco_bairro: bairro,
    endereco_latitude: resultado.latitude,
    endereco_longitude: resultado.longitude
  };
  
  const { error } = await supabase
    .from('demandas')
    .update(updateData)
    .eq('id', id);
    
  if (error) {
    throw error;
  }
}
