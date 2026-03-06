import { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Eye } from 'lucide-react';
import { CAMPOS_DISPONIVEIS, formatarValorCampo } from '../../utils/campoConfig';
import { RelatorioItem } from '../../hooks/useRelatoriosData';

interface TabelaDinamicaProps {
  dados: RelatorioItem[];
  camposSelecionados: string[];
  loading?: boolean;
  onVisualizarItem?: (item: RelatorioItem) => void;
}

type SortDirection = 'asc' | 'desc' | null;

export default function TabelaDinamica({ 
  dados, 
  camposSelecionados, 
  loading = false, 
  onVisualizarItem 
}: TabelaDinamicaProps) {
  const [sortConfig, setSortConfig] = useState<{ campo: string; direction: SortDirection }>({
    campo: 'created_at',
    direction: 'desc',
  });

  const handleSort = (campo: string) => {
    setSortConfig(prev => ({
      campo,
      direction: prev.campo === campo && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedDados = useState(() => {
    if (!sortConfig.direction || !sortConfig.campo) return dados;

    return [...dados].sort((a, b) => {
      const campoConfig = CAMPOS_DISPONIVEIS[sortConfig.campo];
      if (!campoConfig) return 0;

      const valorA = a[campoConfig.accessor as keyof RelatorioItem];
      const valorB = b[campoConfig.accessor as keyof RelatorioItem];

      // Tratar valores nulos/undefined
      if (valorA === null || valorA === undefined) return 1;
      if (valorB === null || valorB === undefined) return -1;

      // Comparação baseada no tipo
      let comparacao = 0;
      if (typeof valorA === 'string' && typeof valorB === 'string') {
        comparacao = valorA.localeCompare(valorB);
      } else if (typeof valorA === 'number' && typeof valorB === 'number') {
        comparacao = valorA - valorB;
      } else if (valorA instanceof Date && valorB instanceof Date) {
        comparacao = valorA.getTime() - valorB.getTime();
      } else {
        // Fallback para string
        comparacao = String(valorA).localeCompare(String(valorB));
      }

      return sortConfig.direction === 'asc' ? comparacao : -comparacao;
    });
  })[0];

  const getSortIcon = (campo: string) => {
    if (sortConfig.campo !== campo || !sortConfig.direction) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-600" />
      : <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  const getCellStyle = (campoId: string) => {
    const campo = CAMPOS_DISPONIVEIS[campoId];
    
    // Alinhamento baseado no tipo de campo
    if (campoId.includes('data') || campoId.includes('dias') || campoId.includes('tempo')) {
      return 'text-center';
    }
    
    if (campoId === 'protocolo' || campoId === 'status') {
      return 'text-center';
    }
    
    return 'text-left';
  };

  const getCellClass = (campoId: string, valor: any) => {
    let baseClass = 'px-3 py-2 text-sm ' + getCellStyle(campoId);
    
    // Status colors
    if (campoId === 'status') {
      switch (valor) {
        case 'aguardando':
          return baseClass + ' text-yellow-700 bg-yellow-50';
        case 'em_analise':
          return baseClass + ' text-blue-700 bg-blue-50';
        case 'finalizado':
          return baseClass + ' text-green-700 bg-green-50';
        default:
          return baseClass + ' text-gray-700';
      }
    }
    
    // Atraso colors
    if (campoId === 'status_atraso') {
      return valor 
        ? baseClass + ' text-red-700 bg-red-50'
        : baseClass + ' text-gray-700';
    }
    
    // Dias de atraso
    if (campoId === 'dias_atraso' && valor > 0) {
      return baseClass + ' text-red-700 font-medium';
    }
    
    return baseClass + ' text-gray-700';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!dados || dados.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="text-center text-gray-500">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Eye className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum dado encontrado</h3>
          <p className="text-sm text-gray-500">
            Tente ajustar os filtros ou selecionar diferentes campos para visualizar os dados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {camposSelecionados.map(campoId => {
                const campo = CAMPOS_DISPONIVEIS[campoId];
                if (!campo) return null;
                
                return (
                  <th
                    key={campoId}
                    onClick={() => handleSort(campoId)}
                    className={`px-3 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${getCellStyle(campoId)}`}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>{campo.label}</span>
                      {getSortIcon(campoId)}
                    </div>
                  </th>
                );
              })}
              {onVisualizarItem && (
                <th className="px-3 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider text-center w-20">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedDados.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                {camposSelecionados.map(campoId => {
                  const campo = CAMPOS_DISPONIVEIS[campoId];
                  if (!campo) return null;
                  
                  const valor = item[campo.accessor as keyof RelatorioItem];
                  const valorFormatado = formatarValorCampo(campoId, valor);
                  
                  return (
                    <td
                      key={campoId}
                      className={getCellClass(campoId, valor)}
                    >
                      {valorFormatado || '-'}
                    </td>
                  );
                })}
                
                {onVisualizarItem && (
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => onVisualizarItem(item)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Visualizar
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Rodapé com informações */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Total de registros: <span className="font-medium text-gray-900">{dados.length}</span>
          </span>
          <span>
            Campos exibidos: <span className="font-medium text-gray-900">{camposSelecionados.length}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
