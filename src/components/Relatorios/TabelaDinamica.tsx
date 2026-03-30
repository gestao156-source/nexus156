import { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';
import { CAMPOS_DISPONIVEIS, formatarValorCampo } from '../../utils/campoConfig';
import { RelatorioItem } from '../../hooks/useRelatoriosData';
import { formatarResponsavel } from '../../utils/responsavelUtils';
import { supabase } from '../../lib/supabase';

interface TabelaDinamicaProps {
  dados: RelatorioItem[];
  camposSelecionados: string[];
  loading?: boolean;
  compact?: boolean;
  onVisualizarItem?: (item: RelatorioItem) => void;
}

export default function TabelaDinamica({ 
  dados, 
  camposSelecionados, 
  loading = false, 
  compact = false,
  onVisualizarItem 
}: TabelaDinamicaProps) {
  // Cache de perfis para o formatarResponsavel
  const [profiles, setProfiles] = useState<any[]>([]);

  // Carregar perfis (mesma lógica do ItemModal)
  useEffect(() => {
    const loadProfiles = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');
      
      setProfiles(data || []);
    };

    loadProfiles();
  }, []);

  const getHeaders = () => {
    return camposSelecionados.map(campoId => {
      const campo = CAMPOS_DISPONIVEIS[campoId];
      return campo?.label || campoId;
    });
  };

  const getCellStyle = (campoId: string) => {
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
        case 'atrasado':
          return baseClass + ' text-red-700 bg-red-50';
        default:
          return baseClass + ' text-gray-900';
      }
    }
    
    // Atraso colors
    if (campoId === 'status_atraso') {
      return valor 
        ? baseClass + ' text-red-700 bg-red-50'
        : baseClass + ' text-gray-900';
    }
    
    // Dias de atraso
    if (campoId === 'dias_atraso' && valor > 0) {
      return baseClass + ' text-red-700 font-medium';
    }
    
    return baseClass + ' text-text-primary';
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
      {/* Header */}
      {!compact && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Resultados</h3>
        </div>
      )}

      {/* Tabela */}
      <div className={`overflow-x-auto ${compact ? '' : 'p-6'}`}>
        <table className={`w-full ${compact ? 'text-xs' : ''}`}>
          <thead className={`${compact ? 'bg-gray-50 sticky top-0' : 'bg-gray-50'}`}>
            <tr>
              {getHeaders().map((header, index) => (
                <th
                  key={index}
                  className={`px-3 py-3 text-left font-medium text-gray-900 uppercase tracking-wider border-b border-gray-200 ${
                    compact ? 'px-2 py-1 text-xs' : ''
                  }`}
                >
                  <span>{header}</span>
                </th>
              ))}
              {!compact && (
                <th className="px-3 py-3 text-center font-medium text-gray-900 uppercase tracking-wider border-b border-gray-200">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className={`${compact ? 'divide-y divide-gray-100' : 'divide-y divide-gray-200'}`}>
            {dados.map((item: RelatorioItem) => (
              <tr key={item.id} className={`${compact ? 'hover:bg-gray-50' : 'hover:bg-gray-50'}`}>
                {getHeaders().map((header) => {
                  const campo = Object.values(CAMPOS_DISPONIVEIS).find(c => c.label === header);
                  if (!campo) return null;
                  
                  const valor = item[campo.accessor as keyof RelatorioItem];
                  const cellClass = getCellClass(campo.id, valor);
                  
                  return (
                    <td key={campo.id} className={cellClass}>
                      {campo.id === 'responsavel' 
                        ? formatarResponsavel(item.responsavel, profiles)
                        : formatarValorCampo(campo.id, valor)
                      }
                    </td>
                  );
                })}
                {!compact && (
                  <td className="px-3 py-4 text-center border-b border-gray-200">
                    {onVisualizarItem && (
                      <button
                        onClick={() => onVisualizarItem(item)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Visualizar item"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {!compact && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Total de registros: {dados.length}</span>
            <span>Campos exibidos: {camposSelecionados.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}

