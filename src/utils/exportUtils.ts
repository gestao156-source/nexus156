/**
 * Utilitários compartilhados para exportação de dados
 */

import { CAMPOS_DISPONIVEIS, formatarValorCampo } from './campoConfig';
import { formatarResponsavel, Profile } from './responsavelUtils';

interface ExportItem {
  id: string;
  created_at: string;
  protocolo?: string;
  assunto?: string;
  status: string;
  responsavel?: string;
  ponto_contato?: string;
  data_contato?: string;
  [key: string]: unknown;
}

export interface ExportOptions {
  camposSelecionados: string[];
  dados: ExportItem[];
  filename?: string;
}

/**
 * Gera headers para exportação
 */
export const gerarHeaders = (camposSelecionados: string[]): string[] => {
  return camposSelecionados.map(campoId => CAMPOS_DISPONIVEIS[campoId]?.label || campoId);
};

/**
 * Gera linhas de dados para exportação usando formatarResponsavel
 */
export const gerarLinhasDados = (dados: ExportItem[], camposSelecionados: string[], profiles: Profile[] = []): unknown[][] => {
  return dados.map(item => {
    return camposSelecionados.map(campoId => {
      const campo = CAMPOS_DISPONIVEIS[campoId];
      if (!campo) return '';
      
      let valor: unknown = item[campo.accessor];
      
      // Usar formatarResponsavel para campos responsavel e ponto_contato
      if (campo.accessor === 'responsavel' || campo.accessor === 'ponto_contato') {
        valor = formatarResponsavel(valor as string | null, profiles);
      } else {
        valor = formatarValorCampo(campoId, valor);
      }
      
      return valor;
    });
  });
};

/**
 * Gera nome de arquivo com timestamp
 */
export const gerarNomeArquivo = (filename: string, extensao: string): string => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  return `${filename}_${timestamp}.${extensao}`;
};

/**
 * Valida dados para exportação
 */
export const validarDadosExportacao = (dados: ExportItem[], camposSelecionados: string[]): boolean => {
  if (!Array.isArray(dados)) return false;
  if (dados.length === 0) return false;
  if (!Array.isArray(camposSelecionados)) return false;
  if (camposSelecionados.length === 0) return false;
  
  return true;
};
