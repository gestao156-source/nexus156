import { useState } from 'react';
import { ArrowRightLeft, Search, Plus, Minus, RotateCcw } from 'lucide-react';
import { CAMPOS_DISPONIVEIS, CAMPOS_GRUPOS } from '../../utils/campoConfig';

interface CampoBuilderProps {
  camposSelecionados: string[];
  onCampoChange: (campo: string, selecionado: boolean) => void;
  onReorder?: (campoId: string, direcao: 'up' | 'down') => void;
}

export default function CampoBuilder({ camposSelecionados, onCampoChange, onReorder }: CampoBuilderProps) {
  const [busca, setBusca] = useState('');
  const [grupoExpandido, setGrupoExpandido] = useState<string[]>(CAMPOS_GRUPOS);

  const camposDisponiveis = Object.values(CAMPOS_DISPONIVEIS).filter(campo => 
    !camposSelecionados.includes(campo.id) &&
    campo.label.toLowerCase().includes(busca.toLowerCase())
  );

  const camposSelecionadosObj = camposSelecionados
    .map(id => CAMPOS_DISPONIVEIS[id])
    .filter(Boolean);

  const toggleGrupo = (grupo: string) => {
    setGrupoExpandido(prev => 
      prev.includes(grupo) 
        ? prev.filter(g => g !== grupo)
        : [...prev, grupo]
    );
  };

  const handleAdicionarCampo = (campoId: string) => {
    onCampoChange(campoId, true);
  };

  const handleRemoverCampo = (campoId: string) => {
    onCampoChange(campoId, false);
  };

  const handleMoverCampo = (campoId: string, direcao: 'up' | 'down') => {
    onReorder?.(campoId, direcao);
  };

  return (
    <div className="space-y-4">
      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar campos..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Campos Disponíveis */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Campos Disponíveis</h3>
          
          {camposDisponiveis.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Nenhum campo encontrado</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {CAMPOS_GRUPOS.map(grupo => {
                const camposDoGrupo = camposDisponiveis.filter(c => c.grupo === grupo);
                if (camposDoGrupo.length === 0) return null;
                
                const isExpandido = grupoExpandido.includes(grupo);
                
                return (
                  <div key={grupo} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleGrupo(grupo)}
                      className="w-full px-3 py-2 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between text-left"
                    >
                      <span className="text-sm font-medium text-gray-700">{grupo}</span>
                      <span className="text-xs text-gray-500">({camposDoGrupo.length})</span>
                    </button>
                    
                    {isExpandido && (
                      <div className="p-2 space-y-1">
                        {camposDoGrupo.map(campo => (
                          <div
                            key={campo.id}
                            className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:border-blue-300 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{campo.label}</div>
                              {campo.obrigatorio && (
                                <span className="text-xs text-blue-600">Obrigatório</span>
                              )}
                            </div>
                            <button
                              onClick={() => handleAdicionarCampo(campo.id)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="Adicionar campo"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Campos Selecionados */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Campos Selecionados</h3>
            <span className="text-sm text-blue-600">{camposSelecionados.length}</span>
          </div>
          
          {camposSelecionadosObj.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              <div className="w-8 h-8 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
                <ArrowRightLeft className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-sm">Nenhum campo selecionado</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {camposSelecionadosObj.map((campo, index) => (
                <div
                  key={campo.id}
                  className="flex items-center justify-between p-2 bg-white rounded border border-blue-200"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{campo.label}</div>
                    <div className="text-xs text-gray-500">{campo.grupo}</div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {onReorder && (
                      <>
                        <button
                          onClick={() => handleMoverCampo(campo.id, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                          title="Mover para cima"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => handleMoverCampo(campo.id, 'down')}
                          disabled={index === camposSelecionadosObj.length - 1}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                          title="Mover para baixo"
                        >
                          ▼
                        </button>
                      </>
                    )}
                    
                    {!campo.obrigatorio && (
                      <button
                        onClick={() => handleRemoverCampo(campo.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Remover campo"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {camposSelecionados.length} campos selecionados
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => {
              // Selecionar todos os campos obrigatórios
              Object.values(CAMPOS_DISPONIVEIS)
                .filter(c => c.obrigatorio)
                .forEach(c => onCampoChange(c.id, true));
            }}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            Obrigatórios
          </button>
          
          <button
            onClick={() => {
              // Limpar seleção (manter obrigatórios)
              const obrigatorios = Object.values(CAMPOS_DISPONIVEIS)
                .filter(c => c.obrigatorio)
                .map(c => c.id);
              
              camposSelecionados.forEach(id => {
                if (!obrigatorios.includes(id)) {
                  onCampoChange(id, false);
                }
              });
            }}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Limpar
          </button>
          
          <button
            onClick={() => {
              // Selecionar todos os campos
              Object.keys(CAMPOS_DISPONIVEIS).forEach(id => onCampoChange(id, true));
            }}
            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
          >
            Todos
          </button>
        </div>
      </div>
    </div>
  );
}
