import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { exportCSV } from '../../utils/exportCSV';
import { exportExcel } from '../../utils/exportExcel';
import { RelatorioItem } from '../../hooks/useRelatoriosData';

interface ExportButtonsProps {
  dados: RelatorioItem[];
  camposSelecionados: string[];
  loading?: boolean;
  disabled?: boolean;
}

type ExportType = 'csv' | 'excel';

export default function ExportButtons({ 
  dados, 
  camposSelecionados, 
  loading = false, 
  disabled = false 
}: ExportButtonsProps) {
  const [exportando, setExportando] = useState<ExportType | null>(null);
  const [exportStatus, setExportStatus] = useState<'success' | 'error' | null>(null);

  const handleExport = async (type: ExportType) => {
    if (disabled || loading || !dados.length || !camposSelecionados.length) {
      return;
    }

    setExportando(type);
    setExportStatus(null);

    try {
      // Simular delay para feedback visual
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (type === 'csv') {
        exportCSV({
          dados,
          camposSelecionados,
          filename: 'relatorio_nexus156',
        });
      } else if (type === 'excel') {
        exportExcel({
          dados,
          camposSelecionados,
          filename: 'relatorio_nexus156',
          sheetName: 'Relatório Nexus156',
        });
      }

      setExportStatus('success');
      
      // Limpar status após 3 segundos
      setTimeout(() => setExportStatus(null), 3000);

    } catch (error) {
      console.error(`Erro ao exportar ${type}:`, error);
      setExportStatus('error');
      
      // Limpar status após 5 segundos
      setTimeout(() => setExportStatus(null), 5000);
    } finally {
      setExportando(null);
    }
  };

  const isDisabled = disabled || loading || !dados.length || !camposSelecionados.length;

  return (
    <div className="flex items-center space-x-4">
      {/* Botão CSV */}
      <button
        onClick={() => handleExport('csv')}
        disabled={isDisabled || exportando !== null}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
          isDisabled || exportando !== null
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
        }`}
      >
        {exportando === 'csv' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        <span>
          {exportando === 'csv' ? 'Exportando...' : 'Exportar CSV'}
        </span>
      </button>

      {/* Botão Excel */}
      <button
        onClick={() => handleExport('excel')}
        disabled={isDisabled || exportando !== null}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
          isDisabled || exportando !== null
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
        }`}
      >
        {exportando === 'excel' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-4 h-4" />
        )}
        <span>
          {exportando === 'excel' ? 'Exportando...' : 'Exportar Excel'}
        </span>
      </button>

      {/* Status Feedback */}
      {exportStatus === 'success' && (
        <div className="flex items-center space-x-2 text-green-600 animate-fade-in">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Exportado com sucesso!</span>
        </div>
      )}

      {exportStatus === 'error' && (
        <div className="flex items-center space-x-2 text-red-600 animate-fade-in">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Erro ao exportar</span>
        </div>
      )}

      {/* Informações */}
      <div className="text-sm text-gray-500">
        {dados.length > 0 && camposSelecionados.length > 0 ? (
          <span>
            {dados.length} registros × {camposSelecionados.length} campos
          </span>
        ) : (
          <span className="text-red-500">
            {!dados.length ? 'Sem dados' : 'Selecione campos'}
          </span>
        )}
      </div>
    </div>
  );
}

// Componente de informações detalhadas
export function ExportInfo({ dados, camposSelecionados }: { dados: RelatorioItem[]; camposSelecionados: string[] }) {
  if (!dados.length || !camposSelecionados.length) {
    return null;
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
      <h4 className="font-medium text-gray-900 mb-3">Resumo da Exportação</h4>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Registros:</span>
          <span className="ml-2 font-medium text-gray-900">{dados.length}</span>
        </div>
        
        <div>
          <span className="text-gray-600">Campos:</span>
          <span className="ml-2 font-medium text-gray-900">{camposSelecionados.length}</span>
        </div>
        
        <div>
          <span className="text-gray-600">Formatos:</span>
          <span className="ml-2 font-medium text-gray-900">CSV, Excel</span>
        </div>
        
        <div>
          <span className="text-gray-600">Tamanho estimado:</span>
          <span className="ml-2 font-medium text-gray-900">
            ~{Math.round((dados.length * camposSelecionados.length * 50) / 1024)}KB
          </span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
        <p>• CSV: Compatível com Excel, separado por vírgulas</p>
        <p>• Excel: Planilha formatada com cabeçalhos</p>
        <p>• Ambos incluem BOM UTF-8 para caracteres especiais</p>
      </div>
    </div>
  );
}
