import * as XLSX from 'xlsx';
import { CAMPOS_DISPONIVEIS, formatarValorCampo } from './campoConfig';

export interface ExportExcelOptions {
  camposSelecionados: string[];
  dados: any[];
  filename?: string;
  sheetName?: string;
}

export const exportExcel = ({ 
  camposSelecionados, 
  dados, 
  filename = 'relatorio', 
  sheetName = 'Relatório' 
}: ExportExcelOptions): void => {
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

    // Criar worksheet
    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Formatar worksheet
    formatWorksheet(ws, headers.length, rows.length);

    // Criar workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Gerar nome de arquivo com timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const finalFilename = `${filename}_${timestamp}.xlsx`;

    // Exportar arquivo
    XLSX.writeFile(wb, finalFilename);

  } catch (error) {
    console.error('Erro ao exportar Excel:', error);
    throw error;
  }
};

const formatWorksheet = (ws: XLSX.WorkSheet, headerCount: number, rowCount: number): void => {
  // Definir largura das colunas
  const colWidths = Array(headerCount).fill({ wch: 15 }); // largura padrão
  ws['!cols'] = colWidths;

  // Formatar headers (primeira linha)
  for (let col = 0; col < headerCount; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    const cell = ws[cellAddress];
    
    if (cell) {
      cell.s = {
        font: { bold: true, sz: 12 },
        fill: { fgColor: { rgb: 'E3F2FD' } }, // Azul claro
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { auto: 1 } },
          bottom: { style: 'thin', color: { auto: 1 } },
          left: { style: 'thin', color: { auto: 1 } },
          right: { style: 'thin', color: { auto: 1 } },
        },
      };
    }
  }

  // Adicionar bordas nas células de dados
  for (let row = 1; row <= rowCount; row++) {
    for (let col = 0; col < headerCount; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = ws[cellAddress];
      
      if (cell) {
        cell.s = {
          alignment: { vertical: 'center', wrapText: true },
          border: {
            top: { style: 'thin', color: { auto: 1 } },
            bottom: { style: 'thin', color: { auto: 1 } },
            left: { style: 'thin', color: { auto: 1 } },
            right: { style: 'thin', color: { auto: 1 } },
          },
        };
      }
    }
  }

  // Congelar painel (headers)
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };

  // Adicionar filtro automático
  if (headerCount > 0 && rowCount > 0) {
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
    ws['!autofilter'] = { ref: `A1:${XLSX.utils.encode_col(range.e.c)}${range.e.r + 1}` };
  }
};

export const generatePreviewExcel = (camposSelecionados: string[], dados: any[], maxRows: number = 5): any[][] => {
  if (!dados || dados.length === 0 || !camposSelecionados || camposSelecionados.length === 0) {
    return [];
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

  return [headers, ...rows];
};

export const validateExcelExport = (dados: any[], camposSelecionados: string[]): boolean => {
  if (!Array.isArray(dados)) return false;
  if (dados.length === 0) return false;
  if (!Array.isArray(camposSelecionados)) return false;
  if (camposSelecionados.length === 0) return false;
  
  // Validar se cada campo selecionado existe na configuração
  for (const campoId of camposSelecionados) {
    if (!CAMPOS_DISPONIVEIS[campoId]) {
      console.warn(`Campo ${campoId} não encontrado na configuração`);
      return false;
    }
  }
  
  return true;
};
