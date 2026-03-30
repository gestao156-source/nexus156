import Papa from 'papaparse';
import { gerarHeaders, gerarLinhasDados, gerarNomeArquivo, validarDadosExportacao, ExportItem } from './exportUtils';
import { supabase } from '../lib/supabase';

export interface CSVExportOptions {
  camposSelecionados: string[];
  dados: ExportItem[];
  filename?: string;
}

/**
 * Exporta dados para formato CSV
 */
export const exportCSV = async ({ camposSelecionados, dados, filename = 'relatorio' }: CSVExportOptions): Promise<void> => {
  try {
    // Validar dados
    if (!validarDadosExportacao(dados, camposSelecionados)) {
      throw new Error('Nenhum campo selecionado');
    }

    // Carregar profiles (mesmo padrão do mapa e tabela)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .order('full_name');

    // Gerar headers e linhas usando formatarResponsavel
    const headers = gerarHeaders(camposSelecionados);
    const rows = gerarLinhasDados(dados, camposSelecionados, profiles || []);

    // Configurar opções do PapaParse
    const csvConfig = {
      header: true,
      separator: ',',
      encoding: 'UTF-8',
      quotes: true,
      quoteChar: '"',
      escapeChar: '"',
    };

    // Criar conteúdo CSV com BOM para Excel brasileiro
    const bom = '\uFEFF';
    const csvContent = Papa.unparse([headers, ...rows], csvConfig);
    const csvWithBom = bom + csvContent;

    // Criar blob e download
    const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      // Gerar nome de arquivo com timestamp
      const finalFilename = gerarNomeArquivo(filename, 'csv');
      link.setAttribute('download', finalFilename);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Fallback para browsers antigos
      const csvData = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvWithBom);
      window.open(csvData);
    }

  } catch (error) {
    console.error('Erro ao exportar CSV', error);
    throw error;
  }
};

/**
 * Gera preview dos dados para exportação
 */
export const generatePreviewCSV = (camposSelecionados: string[], dados: ExportItem[], maxRows: number = 5): string => {
  if (!validarDadosExportacao(dados, camposSelecionados)) {
    return '';
  }

  const previewData = dados.slice(0, maxRows);
  
  // Gerar headers
  const headers = gerarHeaders(camposSelecionados);
  
  // Gerar linhas
  const rows = gerarLinhasDados(previewData, camposSelecionados);

  // Configurar opções do PapaParse
  const csvConfig = {
    header: false,
    separator: ',',
    encoding: 'UTF-8',
    quotes: true,
    quoteChar: '"',
    escapeChar: '"',
  };

  const bom = '\uFEFF';
  const csvContent = Papa.unparse([headers, ...rows], csvConfig);
  return bom + csvContent;
};

export const validateExportData = (dados: ExportItem[]): boolean => {
  if (!Array.isArray(dados)) return false;
  if (dados.length === 0) return false;
  
  // Validar se cada item tem as propriedades básicas
  const firstItem = dados[0];
  if (!firstItem || typeof firstItem !== 'object') return false;
  
  return true;
};
