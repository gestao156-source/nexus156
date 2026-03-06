import { useState, useMemo, useEffect } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Eye } from 'lucide-react';
import { CAMPOS_DISPONIVEIS, formatarValorCampo } from '../../utils/campoConfig';
import { RelatorioItem } from '../../hooks/useRelatoriosData';
import { supabase } from '../../lib/supabase';

interface TabelaDinamicaProps {
  dados: RelatorioItem[];
  camposSelecionados: string[];
  loading?: boolean;
  compact?: boolean;
  onVisualizarItem?: (item: RelatorioItem) => void;
}

type SortDirection = 'asc' | 'desc' | null;

export default function TabelaDinamica({ 
  dados, 
  camposSelecionados, 
  loading = false, 
  compact = false,
  onVisualizarItem 
}: TabelaDinamicaProps) {
  const [sortConfig, setSortConfig] = useState<{ campo: string; direction: SortDirection }>({
    campo: 'created_at',
    direction: 'desc',
  });

  // Cache de perfis (mesma lógica do ItemModal)
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

  const handleSort = (campo: string) => {
    setSortConfig(prev => ({
      campo,
      direction: prev.campo === campo && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedData = useMemo(() => {
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
  }, [dados, sortConfig]);

  // Função específica para formatar responsável (mesma lógica do SELECT)
  const formatarResponsavel = (responsavel: string, user_id: string): string => {
    // Se responsavel tiver nome válido (não UUID), usar
    if (responsavel && !responsavel.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return responsavel;
    }
    
    // Se responsavel for UUID, buscar nome nos profiles (mesma lógica do SELECT)
    if (responsavel && responsavel.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const profile = profiles.find(p => p.id === responsavel);
      if (profile?.full_name) {
        return profile.full_name;
      }
    }
    
    // Se responsavel for vazio, usar user_id
    if (user_id && (!responsavel || responsavel === '')) {
      const profile = profiles.find(p => p.id === user_id);
      if (profile?.full_name) {
        return profile.full_name;
      }
    }
    
    // Fallback: mostrar ID truncado
    const idToShow = responsavel || user_id;
    if (idToShow) {
      return `ID: ${idToShow.substring(0, 8)}...`;
    }
    
    return 'Não informado';
  };

  const getHeaders = () => {
    return camposSelecionados.map(campoId => {
      const campo = CAMPOS_DISPONIVEIS[campoId];
      return campo?.label || campoId;
    });
  };

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
                  className={`px-3 py-3 text-left font-medium text-gray-700 uppercase tracking-wider border-b border-gray-200 ${
                    compact ? 'px-2 py-1 text-xs' : ''
                  }`}
                >
                  <div className="flex items-center space-x-1">
                    <span>{header}</span>
                    {getSortIcon(header)}
                  </div>
                </th>
              ))}
              {!compact && (
                <th className="px-3 py-3 text-center font-medium text-gray-700 uppercase tracking-wider border-b border-gray-200">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className={`${compact ? 'divide-y divide-gray-100' : 'divide-y divide-gray-200'}`}>
            {sortedData.map((item: RelatorioItem) => (
              <tr key={item.id} className={`${compact ? 'hover:bg-gray-50' : 'hover:bg-gray-50'}`}>
                {getHeaders().map((header) => {
                  const campo = Object.values(CAMPOS_DISPONIVEIS).find(c => c.label === header);
                  if (!campo) return null;
                  
                  const valor = item[campo.accessor as keyof RelatorioItem];
                  const cellClass = getCellClass(campo.id, valor);
                  
                  return (
                    <td key={campo.id} className={cellClass}>
                      {campo.id === 'responsavel' 
                        ? formatarResponsavel(item.responsavel, item.user_id)
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
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Total de registros: {dados.length}</span>
            <span>Campos exibidos: {camposSelecionados.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}
