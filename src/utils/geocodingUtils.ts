/**
 * Utilitários para Geocoding SaaS Production-Ready
 * 
 * Funcionalidades:
 * - Hash SHA256 normalizado para cache
 * - Validação de endereço
 * - Funções auxiliares para Edge Function
 */

// Interface para endereço
export interface EnderecoParaHash {
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

// Interface para validação
export interface EnderecoParaValidar {
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

export interface ValidacaoEndereco {
  valido: boolean;
  erros: string[];
}

import Logger from './logger';

/**
 * Gera hash SHA256 normalizado do endereço para cache
 * @param endereco Objeto com campos do endereço
 * @returns Promise<string> Hash SHA256 em formato hexadecimal
 */
export async function gerarHash(endereco: EnderecoParaHash): Promise<string> {
  try {
    // Normalizar endereço
    const normalizado = [
      endereco.rua || '',
      endereco.numero || '',
      endereco.bairro || '',
      endereco.cidade || 'Fortaleza',
      endereco.estado || 'CE',
      endereco.cep || ''
    ]
      .join(',')
      .toLowerCase()
      .trim()
      .normalize('NFD') // Remove acentos
      .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
      .replace(/\s+/g, ' ') // Normaliza espaços
      .replace(/[^\w\s,-]/g, ''); // Remove caracteres especiais

    // Gerar SHA256 (async)
    const encoder = new TextEncoder();
    const data = encoder.encode(normalizado);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    Logger.error('Erro ao gerar hash do endereço', { error }, 'GeocodingUtils', false);
    throw new Error('Falha ao gerar hash do endereço');
  }
}

/**
 * Valida endereço antes de enviar para geocoding
 * @param endereco Objeto com campos do endereço
 * @returns ValidacaoEndereco Resultado da validação
 */
export function validarEndereco(endereco: EnderecoParaValidar): ValidacaoEndereco {
  const erros: string[] = [];

  // Validações obrigatórias
  if (!endereco.rua || endereco.rua.trim().length < 3) {
    erros.push('Rua é obrigatória (mínimo 3 caracteres)');
  }

  if (!endereco.bairro || endereco.bairro.trim().length < 3) {
    erros.push('Bairro é obrigatório (mínimo 3 caracteres)');
  }

  if (!endereco.cidade || endereco.cidade.trim().length < 3) {
    erros.push('Cidade é obrigatória (mínimo 3 caracteres)');
  }

  if (!endereco.estado || endereco.estado.trim().length !== 2) {
    erros.push('Estado é obrigatório (2 caracteres)');
  }

  // Validações de formato
  if (endereco.rua && !/^[a-zA-Z0-9\s\-\.\,ºª]+$/.test(endereco.rua)) {
    erros.push('Rua contém caracteres inválidos');
  }

  if (endereco.numero && !/^[a-zA-Z0-9\s\-\./]+$/.test(endereco.numero)) {
    erros.push('Número contém caracteres inválidos');
  }

  if (endereco.cep && !/^\d{8}$/.test(endereco.cep.replace(/\D/g, ''))) {
    erros.push('CEP deve conter 8 dígitos');
  }

  // Validação de estado brasileiro
  if (endereco.estado) {
    const estadosValidos = [
      'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
      'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ];
    
    if (!estadosValidos.includes(endereco.estado.toUpperCase())) {
      erros.push('Estado inválido (deve ser uma sigla brasileira válida)');
    }
  }

  return {
    valido: erros.length === 0,
    erros
  };
}

/**
 * Constrói endereço completo para geocoding
 * @param endereco Objeto com campos do endereço
 * @returns string Endereço formatado
 */
export function construirEnderecoCompleto(endereco: EnderecoParaHash): string {
  return [
    endereco.rua,
    endereco.numero,
    endereco.bairro,
    endereco.cidade || 'Fortaleza',
    endereco.estado || 'CE',
    endereco.cep
  ]
    .filter(Boolean)
    .join(', ');
}

/**
 * Verifica se coordenadas são válidas
 * @param latitude Latitude
 * @param longitude Longitude
 * @returns boolean Se as coordenadas são válidas
 */
export function validarCoordenadas(latitude: number, longitude: number): boolean {
  // Verificar se são números
  if (isNaN(latitude) || isNaN(longitude)) {
    return false;
  }

  // Verificar faixa de latitude (-90 a 90)
  if (latitude < -90 || latitude > 90) {
    return false;
  }

  // Verificar faixa de longitude (-180 a 180)
  if (longitude < -180 || longitude > 180) {
    return false;
  }

  // Verificar se não são zero (provavelmente inválido)
  if (latitude === 0 && longitude === 0) {
    return false;
  }

  return true;
}

/**
 * Verifica se o cache expirou
 * @param expiresAt Data de expiração
 * @returns boolean Se o cache expirou
 */
export function cacheExpirado(expiresAt: string): boolean {
  try {
    const expiryDate = new Date(expiresAt);
    return expiryDate < new Date();
  } catch (error) {
    Logger.error('Erro ao verificar expiração do cache', { error }, 'GeocodingUtils', false);
    return true; // Se não conseguir verificar, considera expirado
  }
}

/**
 * Formata endereço para exibição
 * @param endereco Objeto com campos do endereço
 * @returns string Endereço formatado para exibição
 */
export function formatarEnderecoExibicao(endereco: Partial<EnderecoParaHash>): string {
  const partes = [];
  
  if (endereco.rua) {
    partes.push(endereco.rua);
    if (endereco.numero) {
      partes[partes.length - 1] = `${endereco.rua}, ${endereco.numero}`;
    }
  }
  
  if (endereco.bairro) {
    partes.push(endereco.bairro);
  }
  
  if (endereco.cep) {
    partes.push(endereco.cep);
  }
  
  if (endereco.cidade && endereco.estado) {
    partes.push(`${endereco.cidade}/${endereco.estado}`);
  }

  return partes.join(' - ') || 'Endereço não informado';
}

/**
 * Calcula distância entre duas coordenadas (fórmula de Haversine)
 * @param lat1 Latitude do ponto 1
 * @param lon1 Longitude do ponto 1
 * @param lat2 Latitude do ponto 2
 * @param lon2 Longitude do ponto 2
 * @returns number Distância em metros
 */
export function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Raio da Terra em metros
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distância em metros
}

/**
 * Verifica se um ponto está dentro de um bounding box
 * @param lat Latitude do ponto
 * @param lon Longitude do ponto
 * @param bounds Objeto com limites do bounding box
 * @returns boolean Se o ponto está dentro do bounding box
 */
export function pontoDentroDoBounds(
  lat: number, 
  lon: number, 
  bounds: { north: number; south: number; east: number; west: number }
): boolean {
  return lat >= bounds.south && 
         lat <= bounds.north && 
         lon >= bounds.west && 
         lon <= bounds.east;
}

/**
 * Atrasa execução para rate limiting
 * @param ms Milissegundos para esperar
 * @returns Promise<void>
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
