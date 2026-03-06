import { useState } from 'react';
import { CheckSquare, Square, Settings, RotateCcw } from 'lucide-react';
import { CAMPOS_DISPONIVEIS, CAMPOS_GRUPOS, CampoConfig } from '../../utils/campoConfig';

interface CampoSelectorProps {
  camposSelecionados: string[];
  onCampoChange: (campo: string, selecionado: boolean) => void;
  onSelecionarTodos: () => void;
  onLimparSelecao: () => void;
}

export default function CampoSelector({ 
  camposSelecionados, 
  onCampoChange, 
  onSelecionarTodos, 
  onLimparSelecao 
}: CampoSelectorProps) {
  const [grupoExpandido, setGrupoExpandido] = useState<string[]>(CAMPOS_GRUPOS);

  const toggleGrupo = (grupo: string) => {
    setGrupoExpandido((prev: string[]) => 
      prev.includes(grupo) 
        ? prev.filter((g: string) => g !== grupo)
        : [...prev, grupo]
    );
  };

  const isCampoSelecionado = (campoId: string): boolean => {
    return camposSelecionados.includes(campoId);
  };

  const isGrupoSelecionado = (grupo: string): boolean => {
    const camposDoGrupo = CAMPOS_GRUPOS.includes(grupo) 
      ? Object.values(CAMPOS_DISPONIVEIS).filter(c => c.grupo === grupo)
      : [];
    
    if (camposDoGrupo.length === 0) return false;
    
    return camposDoGrupo.every(campo => isCampoSelecionado(campo.id));
  };

  const isGrupoParcialmenteSelecionado = (grupo: string): boolean => {
    const camposDoGrupo = CAMPOS_GRUPOS.includes(grupo) 
      ? Object.values(CAMPOS_DISPONIVEIS).filter(c => c.grupo === grupo)
      : [];
    
    if (camposDoGrupo.length === 0) return false;
    
    const selecionados = camposDoGrupo.filter(campo => isCampoSelecionado(campo.id));
    return selecionados.length > 0 && selecionados.length < camposDoGrupo.length;
  };

  const handleGrupoChange = (grupo: string, selecionar: boolean) => {
    const camposDoGrupo = Object.values(CAMPOS_DISPONIVEIS).filter(c => c.grupo === grupo);
    camposDoGrupo.forEach(campo => {
      onCampoChange(campo.id, selecionar);
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Seleção de Campos</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onSelecionarTodos}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Selecionar Todos</span>
          </button>
          
          <button
            onClick={onLimparSelecao}
            className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Limpar</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {CAMPOS_GRUPOS.map(grupo => {
          const camposDoGrupo = Object.values(CAMPOS_DISPONIVEIS).filter(c => c.grupo === grupo);
          const isExpandido = grupoExpandido.includes(grupo);
          const isGrupoCompleto = isGrupoSelecionado(grupo);
          const isGrupoParcial = isGrupoParcialmenteSelecionado(grupo);

          return (
            <div key={grupo} className="border border-gray-200 rounded-lg overflow-hidden">
              <div
                onClick={() => toggleGrupo(grupo)}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center">
                    {isGrupoCompleto ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : isGrupoParcial ? (
                      <div className="w-5 h-5 border-2 border-blue-600 rounded bg-blue-600 flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">{grupo}</h4>
                    <p className="text-sm text-gray-500">
                      {camposDoGrupo.filter(c => isCampoSelecionado(c.id)).length} de {camposDoGrupo.length} selecionados
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGrupoChange(grupo, !isGrupoCompleto);
                    }}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
                  >
                    {isGrupoCompleto ? 'Desmarcar' : 'Marcar'}
                  </button>
                  
                  <div className={`transform transition-transform ${isExpandido ? 'rotate-180' : ''}`}>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {isExpandido && (
                <div className="p-4 bg-white space-y-2">
                  {camposDoGrupo.map(campo => (
                    <CampoCheckbox
                      key={campo.id}
                      campo={campo}
                      selecionado={isCampoSelecionado(campo.id)}
                      onChange={onCampoChange}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Total de campos selecionados: <span className="font-medium text-gray-900">{camposSelecionados.length}</span>
          </span>
          <span className="text-gray-500">
            Campos obrigatórios sempre incluídos
          </span>
        </div>
      </div>
    </div>
  );
}

interface CampoCheckboxProps {
  campo: CampoConfig;
  selecionado: boolean;
  onChange: (campo: string, selecionado: boolean) => void;
}

function CampoCheckbox({ campo, selecionado, onChange }: CampoCheckboxProps) {
  const handleChange = () => {
    if (campo.obrigatorio) return; // Não permite desmarcar campos obrigatórios
    onChange(campo.id, !selecionado);
  };

  return (
    <div className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
      <button
        onClick={handleChange}
        disabled={campo.obrigatorio}
        className={`flex items-center ${
          campo.obrigatorio ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
        }`}
      >
        {selecionado ? (
          <CheckSquare className="w-4 h-4 text-blue-600" />
        ) : (
          <Square className={`w-4 h-4 ${campo.obrigatorio ? 'text-gray-400' : 'text-gray-400'}`} />
        )}
      </button>
      
      <div className="flex-1">
        <span className={`text-sm ${campo.obrigatorio ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
          {campo.label}
        </span>
        {campo.obrigatorio && (
          <span className="ml-2 text-xs text-blue-600 font-medium">(Obrigatório)</span>
        )}
      </div>
    </div>
  );
}
