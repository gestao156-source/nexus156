/**
 * Utilitários para tratamento do campo responsável
 */

import { supabase } from '../lib/supabase';
import Logger from './logger';
import { Profile } from '../types/index';

// Re-exportar Profile para uso em outros módulos
export type { Profile } from '../types/index';

/**
 * Verifica se uma string é um UUID válido
 */
export function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Formata o campo responsável para exibição
 * - Se for UUID, busca o nome na lista de profiles
 * - Se for texto, retorna o texto limpo
 * - Se for número, formata como ID
 * - Se for vazio/nulo, retorna valor padrão
 */
export function formatarResponsavel(
  responsavel: string | null | undefined,
  profiles: Profile[] = [],
  valorPadrao = 'Não definido'
): string {
  if (!responsavel) return valorPadrao;
  
  // Se for UUID, buscar nome nos profiles
  if (isUUID(responsavel)) {
    const profile = profiles.find(p => p.id === responsavel);
    if (profile?.full_name) {
      return profile.full_name;
    }
    return 'Responsável não encontrado';
  }
  
  // Se for número, formatar como ID
  if (typeof responsavel === 'number' || /^\d+$/.test(responsavel)) {
    return `ID: ${responsavel}`;
  }
  
  // Se for texto, retornar limpo
  return String(responsavel).trim();
}

/**
 * Busca nomes de responsáveis em lote para otimizar performance
 */
export async function buscarNomesResponsaveis(
  responsaveis: (string | null | undefined)[]
): Promise<Map<string, string>> {
  const nomesMap = new Map<string, string>();
  
  // Filtrar apenas UUIDs não vazios
  const uuidsUnicos = responsaveis
    .filter(r => r && isUUID(r))
    .filter((uuid, index, arr) => arr.indexOf(uuid) === index); // remover duplicados
  
  if (uuidsUnicos.length === 0) return nomesMap;
  
  try {
    // Buscar em lote no Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', uuidsUnicos as string[]);
    
    if (error) throw error;
    
    // Preencher mapa com nomes encontrados
    (data || []).forEach((profile: any) => {
      if (profile.full_name) {
        nomesMap.set(profile.id, profile.full_name);
      }
    });
    
    return nomesMap;
  } catch (error) {
    Logger.error('Erro ao buscar nomes de responsáveis', { error }, 'ResponsavelUtils', false);
    return nomesMap;
  }
}

/**
 * Prepara dados com responsáveis formatados para exibição
 */
export function prepararDadosComResponsaveisFormatados<T extends { responsavel?: string | null }>(
  dados: T[],
  profiles: Profile[],
  campoPadrao = 'Não definido'
): (T & { responsavel_formatado: string })[] {
  return dados.map(item => ({
    ...item,
    responsavel_formatado: formatarResponsavel(item.responsavel, profiles, campoPadrao)
  }));
}
