import Papa from 'papaparse';
import { CAMPOS_DISPONIVEIS, formatarValorCampo } from './campoConfig';

export interface ExportOptions {
  camposSelecionados: string[];
  dados: any[];
  filename?: string;
}

export const exportCSV = ({ camposSelecionados, dados, filename = 'relatorio' }: ExportOptions): void => {
  try {
    // Validar dados
    if (!dados || dados.length === 0) {
      throw new Error('Nenhum dado para exportar');
    }

    if (!camposSelecionados || camposSelecionados.length === 0) {
      throw new Error('Nenhum campo selecionado');
    }

    // Gerar headers
    const headers = camposSelecionados.map(campoId => CAMPOS_DISPONIVEIS[campoId]?.label || campoId);

    // Gerar linhas de dados
    const rows = dados.map(item => {
      return camposSelecionados.map(campoId => {
        const campo = CAMPOS_DISPONIVEIS[campoId];
        if (!campo) return '';
        
        const valor = item[campo.accessor];
        return formatarValorCampo(campoId, valor);
      });
    });

    // Configurar opções do PapaParse
    const csvConfig = {
      header: false, // Usaremos headers manuais
      separator: ',',
      encoding: 'UTF-8',
      quotes: true,
      quoteChar: '"',
      escapeChar: '"',
    };

    // Criar conteúdo CSV com BOM para Excel brasileiro
    const bom = '\uFEFF'; // BOM para UTF-8
    const csvContent = Papa.unparse([headers, ...rows], csvConfig);
    const csvWithBom = bom + csvContent;

    // Criar blob e download
    const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      // Gerar nome de arquivo com timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const finalFilename = `${filename}_${timestamp}.csv`;
      
      link.setAttribute('download', finalFilename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpar URL
      URL.revokeObjectURL(url);
    } else {
      // Fallback para browsers antigos
      const csvData = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvWithBom);
      window.open(csvData);
    }

  } catch (error) {
    console.error('Erro ao exportar CSV:', error);
    throw error;
  }
};

export const validateExportData = (dados: any[]): boolean => {
  if (!Array.isArray(dados)) return false;
  if (dados.length === 0) return false;
  
  // Validar se cada item tem as propriedades básicas
  const firstItem = dados[0];
  if (!firstItem || typeof firstItem !== 'object') return false;
  
  return true;
};

export const generatePreviewCSV = (camposSelecionados: string[], dados: any[], maxRows: number = 5): string => {
  if (!dados || dados.length === 0 || !camposSelecionados || camposSelecionados.length === 0) {
    return '';
  }

  // Limitar dados para preview
  const previewData = dados.slice(0, maxRows);
  
  // Gerar headers
  const headers = camposSelecionados.map(campoId => CAMPOS_DISPONIVEIS[campoId]?.label || campoId);
  
  // Gerar linhas
  const rows = previewData.map(item => {
    return camposSelecionados.map(campoId => {
      const campo = CAMPOS_DISPONIVEIS[campoId];
      if (!campo) return '';
      
      const valor = item[campo.accessor];
      return formatarValorCampo(campoId, valor);
    });
  });

  // Criar CSV preview
  const csvConfig = {
    header: false,
    separator: ',',
    quotes: true,
  };

  return Papa.unparse([headers, ...rows], csvConfig);
};
