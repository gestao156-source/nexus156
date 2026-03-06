import { useState, useEffect } from 'react';
import { BarChart3, Filter, Download, RefreshCw, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRelatoriosData, FiltrosType } from '../hooks/useRelatoriosData';
import { CAMPOS_DISPONIVEIS } from '../utils/campoConfig';
import CampoSelector from '../components/Relatorios/CampoSelector';
import FiltroRelatorios from '../components/Relatorios/FiltroRelatorios';
import TabelaDinamica from '../components/Relatorios/TabelaDinamica';
import ExportButtons, { ExportInfo } from '../components/Relatorios/ExportButtons';

const getDefaultFiltros = (): FiltrosType => ({
  periodo: { inicio: '', fim: '' },
  status: [],
  responsaveis: [],
  tipo: 'todos',
  usuario: 'proprios',
});

const getDefaultCamposSelecionados = (): string[] => {
  return Object.values(CAMPOS_DISPONIVEIS)
    .filter(campo => campo.obrigatorio)
    .map(campo => campo.id);
};

export default function Relatorios() {
  const { profile } = useAuth();
  const [filtros, setFiltros] = useState<FiltrosType>(getDefaultFiltros());
  const [camposSelecionados, setCamposSelecionados] = useState<string[]>(getDefaultCamposSelecionados());
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showCampoSelector, setShowCampoSelector] = useState(false);
  
  const { dados, loading, error, recarregar } = useRelatoriosData(filtros);
  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    // Se não for admin, sempre mostrar apenas próprios itens
    if (!isAdmin && filtros.usuario === 'todos') {
      setFiltros(prev => ({ ...prev, usuario: 'proprios' }));
    }
  }, [isAdmin, filtros.usuario]);

  const handleFiltroChange = (filtro: string, valor: any) => {
    setFiltros(prev => ({
      ...prev,
      [filtro]: valor,
    }));
  };

  const handleCampoChange = (campo: string, selecionado: boolean) => {
    setCamposSelecionados(prev => {
      if (selecionado) {
        return [...prev, campo];
      } else {
        return prev.filter(c => c !== campo);
      }
    });
  };

  const handleSelecionarTodosCampos = () => {
    setCamposSelecionados(Object.keys(CAMPOS_DISPONIVEIS));
  };

  const handleLimparSelecaoCampos = () => {
    setCamposSelecionados(getDefaultCamposSelecionados());
  };

  const handleLimparFiltros = () => {
    setFiltros(getDefaultFiltros());
  };

  const handleVisualizarItem = (item: any) => {
    // Navegar para o item específico
    const tipo = item.tipo === 'solicitacao' ? 'solicitacoes' : 'demandas';
    window.open(`/${tipo}?itemId=${item.id}#item-${item.id}`, '_blank');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Relatórios</h2>
          <p className="text-gray-600 mt-1">
            Crie relatórios personalizados com filtros avançados e exportação para CSV/Excel
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-600">
              {dados.length} registros encontrados
            </div>
            <div className="text-xs text-gray-500">
              {camposSelecionados.length} campos selecionados
            </div>
          </div>
          
          <button
            onClick={recarregar}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-red-600" />
            <div>
              <h4 className="text-red-800 font-medium">Erro ao carregar dados</h4>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel Lateral - Configurações Compactas */}
        <div className="space-y-4">
          {/* Filtros Rápidos */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Filtros Rápidos</h3>
              <Filter className="w-4 h-4 text-gray-600" />
            </div>
            
            <div className="space-y-3">
              {/* Período */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 w-20">Período:</label>
                <input
                  type="date"
                  value={filtros.periodo.inicio}
                  onChange={(e) => handleFiltroChange('periodo', { ...filtros.periodo, inicio: e.target.value })}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-gray-500">a</span>
                <input
                  type="date"
                  value={filtros.periodo.fim}
                  onChange={(e) => handleFiltroChange('periodo', { ...filtros.periodo, fim: e.target.value })}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Tipo */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 w-20">Tipo:</label>
                <div className="flex space-x-1">
                  {[
                    { value: 'todos', label: 'Todos' },
                    { value: 'solicitacoes', label: 'Solicitações' },
                    { value: 'demandas', label: 'Demandas' }
                  ].map(tipo => (
                    <button
                      key={tipo.value}
                      onClick={() => handleFiltroChange('tipo', tipo.value)}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        filtros.tipo === tipo.value
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {tipo.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 w-20">Status:</label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { value: 'aguardando', label: 'Aguardando' },
                    { value: 'em_analise', label: 'Em Análise' },
                    { value: 'finalizado', label: 'Finalizado' }
                  ].map(status => (
                    <button
                      key={status.value}
                      onClick={() => {
                        const novosStatus = filtros.status.includes(status.value)
                          ? filtros.status.filter(s => s !== status.value)
                          : [...filtros.status, status.value];
                        handleFiltroChange('status', novosStatus);
                      }}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        filtros.status.includes(status.value)
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ações dos Filtros */}
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <button
                  onClick={handleLimparFiltros}
                  className="text-xs text-gray-600 hover:text-gray-800"
                >
                  Limpar filtros
                </button>
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {showAdvancedFilters ? 'Menos' : 'Mais'} filtros
                </button>
              </div>
            </div>
          </div>

          {/* Seleção de Campos Compacta */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Campos ({camposSelecionados.length})</h3>
              <Settings className="w-4 h-4 text-gray-600" />
            </div>
            
            <div className="space-y-2">
              {/* Campos obrigatórios sempre visíveis */}
              <div className="text-xs text-gray-500 mb-2">Obrigatórios:</div>
              <div className="flex flex-wrap gap-1 mb-3">
                {Object.values(CAMPOS_DISPONIVEIS)
                  .filter(c => c.obrigatorio)
                  .map(campo => (
                    <span key={campo.id} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                      {campo.label}
                    </span>
                  ))}
              </div>

              {/* Campos opcionais selecionados */}
              {camposSelecionados.filter(id => !CAMPOS_DISPONIVEIS[id]?.obrigatorio).length > 0 && (
                <>
                  <div className="text-xs text-gray-500 mb-2">Opcionais selecionados:</div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {camposSelecionados
                      .filter(id => !CAMPOS_DISPONIVEIS[id]?.obrigatorio)
                      .map(campoId => {
                        const campo = CAMPOS_DISPONIVEIS[campoId];
                        return campo ? (
                          <span key={campoId} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {campo.label}
                          </span>
                        ) : null;
                      })}
                  </div>
                </>
              )}

              {/* Ações */}
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <button
                  onClick={handleSelecionarTodosCampos}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Selecionar todos
                </button>
                <button
                  onClick={() => setShowCampoSelector(!showCampoSelector)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {showCampoSelector ? 'Ocultar' : 'Editar'} seleção
                </button>
              </div>
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Ações</h3>
              <RefreshCw className="w-4 h-4 text-gray-600" />
            </div>
            
            <div className="space-y-2">
              <button
                onClick={recarregar}
                disabled={loading}
                className="w-full px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                {loading ? 'Atualizando...' : 'Atualizar dados'}
              </button>
              
              <button
                onClick={() => {
                  handleLimparFiltros();
                  handleLimparSelecaoCampos();
                }}
                className="w-full px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                Resetar tudo
              </button>
            </div>
          </div>
        </div>

        {/* Área Principal - Dados e Exportação */}
        <div className="space-y-4">
          {/* Export Buttons */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Exportação</h3>
              <Download className="w-5 h-5 text-gray-600" />
            </div>
            
            <div className="space-y-4">
              <ExportButtons
                dados={dados}
                camposSelecionados={camposSelecionados}
                loading={loading}
                disabled={!dados.length || !camposSelecionados.length}
              />
              
              <ExportInfo
                dados={dados}
                camposSelecionados={camposSelecionados}
              />
            </div>
          </div>

          {/* Tabela de Resultados */}
          <TabelaDinamica
            dados={dados}
            camposSelecionados={camposSelecionados}
            loading={loading}
            onVisualizarItem={handleVisualizarItem}
          />
        </div>
      </div>

      {/* Seções Expansivas - Filtros Avançados e Seleção de Campos */}
      {showAdvancedFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Filtros Avançados</h3>
                <button
                  onClick={() => setShowAdvancedFilters(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <FiltroRelatorios
                filtros={filtros}
                onFiltroChange={handleFiltroChange}
                onLimparFiltros={handleLimparFiltros}
                isAdmin={isAdmin}
              />
            </div>
          </div>
        </div>
      )}

      {showCampoSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Seleção de Campos</h3>
                <button
                  onClick={() => setShowCampoSelector(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <CampoSelector
                camposSelecionados={camposSelecionados}
                onCampoChange={handleCampoChange}
                onSelecionarTodos={handleSelecionarTodosCampos}
                onLimparSelecao={handleLimparSelecaoCampos}
              />
            </div>
          </div>
        </div>
      )}

      {/* Instructions para novos usuários */}
      {dados.length === 0 && !loading && !error && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <BarChart3 className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h4 className="text-blue-900 font-medium mb-2">Como usar os relatórios</h4>
              <ol className="text-blue-800 text-sm space-y-1 list-decimal list-inside">
                <li>Selecione os campos que deseja incluir no relatório</li>
                <li>Aplique filtros para refinar os dados (período, status, responsáveis)</li>
                <li>Visualize os resultados na tabela dinâmica</li>
                <li>Exporte para CSV ou Excel com os campos selecionados</li>
              </ol>
              <p className="text-blue-700 text-xs mt-3">
                Dica: Campos obrigatórios (Protocolo e Tipo) sempre serão incluídos
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
