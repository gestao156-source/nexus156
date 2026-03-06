import { useState, useEffect } from 'react';
import { BarChart3, Filter, Download, RefreshCw } from 'lucide-react';
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar - Filtros e Seleção de Campos */}
        <div className="lg:col-span-1 space-y-6">
          {/* Filtros */}
          <FiltroRelatorios
            filtros={filtros}
            onFiltroChange={handleFiltroChange}
            onLimparFiltros={handleLimparFiltros}
            isAdmin={isAdmin}
          />

          {/* Seleção de Campos */}
          <CampoSelector
            camposSelecionados={camposSelecionados}
            onCampoChange={handleCampoChange}
            onSelecionarTodos={handleSelecionarTodosCampos}
            onLimparSelecao={handleLimparSelecaoCampos}
          />
        </div>

        {/* Main Content - Tabela e Exportação */}
        <div className="lg:col-span-3 space-y-6">
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
