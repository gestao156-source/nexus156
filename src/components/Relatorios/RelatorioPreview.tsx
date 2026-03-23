import { useState, useEffect } from 'react';
import { Eye, RefreshCw, Download, Save } from 'lucide-react';
import { RelatorioItem } from '../../hooks/useRelatoriosData';
import { CAMPOS_DISPONIVEIS, formatarValorCampo } from '../../utils/campoConfig';
import { generatePreviewCSV } from '../../utils/exportCSV';

interface RelatorioPreviewProps {
  dados: RelatorioItem[];
  camposSelecionados: string[];
  filtros: any;
  loading?: boolean;
  compact?: boolean;
  onSalvarModelo?: () => void;
  onExportar?: (formato: 'csv' | 'excel' | 'pdf') => void;
}

export default function RelatorioPreview({ 
  dados, 
  camposSelecionados, 
  compact = false,
  onSalvarModelo,
  onExportar 
}: RelatorioPreviewProps) {
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showExportOptions, setShowExportOptions] = useState(false);

  // Atualizar preview quando dados ou campos mudarem
  useEffect(() => {
    if (dados && camposSelecionados) {
      const limit = compact ? 5 : 10; // Modo compacto mostra menos registros
      const preview = dados.slice(0, limit);
      setPreviewData(preview);
      setLastUpdate(new Date());
    }
  }, [dados, camposSelecionados, compact]);

  const getTempoDesdeAtualizacao = () => {
    const agora = new Date();
    const diff = agora.getTime() - lastUpdate.getTime();
    const segundos = Math.floor(diff / 1000);
    
    if (segundos < 60) return `${segundos} segundos`;
    if (segundos < 3600) return `${Math.floor(segundos / 60)} minutos`;
    return `${Math.floor(segundos / 3600)} horas`;
  };

  const getHeaders = () => {
    return camposSelecionados.map(campoId => {
      const campo = CAMPOS_DISPONIVEIS[campoId];
      return campo?.label || campoId;
    });
  };

  const formatCellValue = (campoId: string, item: RelatorioItem) => {
    const campo = CAMPOS_DISPONIVEIS[campoId];
    if (!campo) return '';
    
    return formatarValorCampo(campoId, item[campo.accessor as keyof RelatorioItem]) || '-';
  };

  const getCellClass = (campoId: string, valor: any) => {
    let baseClass = 'px-3 py-2 text-sm border border-gray-200';
    
    // Status colors
    if (campoId === 'status') {
      switch (valor) {
        case 'aguardando':
          return baseClass + ' bg-yellow-50 text-yellow-700';
        case 'em_analise':
          return baseClass + ' bg-blue-50 text-blue-700';
        case 'finalizado':
          return baseClass + ' bg-green-50 text-green-700';
        default:
          return baseClass + ' text-gray-700';
      }
    }
    
    // Atraso colors
    if (campoId === 'status_atraso') {
      return valor 
        ? baseClass + ' bg-red-50 text-red-700'
        : baseClass + ' text-gray-700';
    }
    
    return baseClass + ' text-gray-700';
  };

  const getCSVPreview = () => {
    if (!previewData.length || !camposSelecionados.length) return '';
    return generatePreviewCSV(camposSelecionados, previewData, 3);
  };

  if (!dados || dados.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sem dados para preview</h3>
          <p className="text-sm text-gray-500">
            Ajuste os filtros para visualizar o preview do relatório
          </p>
        </div>
      </div>
    );
  }

  // Modo compacto
  if (compact) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">Preview</span>
            <span className="text-xs text-gray-500">📊 {dados.length} | 📋 {camposSelecionados.length}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onExportar?.('csv')}
              className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
            >
              CSV
            </button>
            <button
              onClick={() => onExportar?.('excel')}
              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
            >
              Excel
            </button>
          </div>
        </div>

        <div className="max-h-32 overflow-y-auto border border-gray-200 rounded">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {getHeaders().map((header, index) => (
                  <th
                    key={index}
                    className="px-2 py-1 text-xs font-medium text-gray-700 text-center border-b border-gray-200"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {previewData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  {camposSelecionados.map(campoId => {
                    return (
                      <td
                        key={campoId}
                        className="px-2 py-1 text-center border-b border-gray-100 text-gray-700"
                      >
                        {formatCellValue(campoId, item)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-2 text-xs text-gray-500 text-center">
          Mostrando {previewData.length} de {dados.length} registros
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header do Preview */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Eye className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Preview do Relatório</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>📊 {dados.length} registros</span>
                <span>📋 {camposSelecionados.length} campos</span>
                <span>🔄 Atualizado há {getTempoDesdeAtualizacao()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPreviewData(dados.slice(0, 10))}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Atualizar preview"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setShowExportOptions(!showExportOptions)}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Exportar</span>
              </button>
              
              {showExportOptions && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        onExportar?.('csv');
                        setShowExportOptions(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center space-x-2"
                    >
                      <span className="text-green-600">📄</span>
                      <div>
                        <div className="font-medium">CSV</div>
                        <div className="text-xs text-gray-500">Dados puros para sistemas</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        onExportar?.('excel');
                        setShowExportOptions(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center space-x-2"
                    >
                      <span className="text-blue-600">📊</span>
                      <div>
                        <div className="font-medium">Excel</div>
                        <div className="text-xs text-gray-500">Formatado com cores</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        onExportar?.('pdf');
                        setShowExportOptions(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded flex items-center space-x-2"
                    >
                      <span className="text-red-600">📑</span>
                      <div>
                        <div className="font-medium">PDF</div>
                        <div className="text-xs text-gray-500">Para apresentação</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {onSalvarModelo && (
              <button
                onClick={onSalvarModelo}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span className="text-sm">Salvar Modelo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabela de Preview */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {getHeaders().map((header, index) => (
                <th
                  key={index}
                  className="px-3 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider text-center border-b border-gray-200"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {previewData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                {camposSelecionados.map(campoId => {
                  return (
                    <td
                      key={campoId}
                      className={getCellClass(campoId, item[campoId as keyof RelatorioItem])}
                    >
                      {formatCellValue(campoId, item)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rodapé com informações */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Preview: {previewData.length} de {dados.length} registros</span>
            <span>•</span>
            <span>Campos: {camposSelecionados.length} selecionados</span>
          </div>
          
          {dados.length > 10 && (
            <div className="text-xs text-gray-500">
              Mostrando primeiros 10 registros • Exportar para ver todos
            </div>
          )}
        </div>
      </div>

      {/* Preview CSV (oculto, para referência) */}
      <div className="hidden">
        <pre>{getCSVPreview()}</pre>
      </div>
    </div>
  );
}
