/**
 * Utilitários compartilhados para exportação de dados
 */

import { CAMPOS_DISPONIVEIS, formatarValorCampo } from './campoConfig';
import { formatarResponsavel } from './responsavelUtils';

export interface ExportOptions {
  camposSelecionados: string[];
  dados: any[];
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
export const gerarLinhasDados = (dados: any[], camposSelecionados: string[], profiles: any[] = []): any[][] => {
  return dados.map(item => {
    return camposSelecionados.map(campoId => {
      const campo = CAMPOS_DISPONIVEIS[campoId];
      if (!campo) return '';
      
      let valor = item[campo.accessor];
      
      // Usar formatarResponsavel para campos responsavel e ponto_contato
      if (campo.accessor === 'responsavel' || campo.accessor === 'ponto_contato') {
        valor = formatarResponsavel(valor, profiles);
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
export const validarDadosExportacao = (dados: any[], camposSelecionados: string[]): boolean => {
  if (!Array.isArray(dados)) return false;
  if (dados.length === 0) return false;
  if (!Array.isArray(camposSelecionados)) return false;
  if (camposSelecionados.length === 0) return false;
  
  return true;
};
