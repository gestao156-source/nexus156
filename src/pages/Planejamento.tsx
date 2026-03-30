import { LayoutDashboard } from 'lucide-react';
import { usePlanejamentoData } from '../hooks/usePlanejamentoData';
import PlanejamentoBoard from '../components/Planejamento/PlanejamentoBoard';

export default function Planejamento() {
  const {
    tarefas,
    profiles,
    loading,
    error,
    refetch,
    createTarefa,
    updateTarefa
  } = usePlanejamentoData();

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <LayoutDashboard className="w-12 h-12 mx-auto mb-2" />
            <h2 className="text-lg font-semibold">Erro ao carregar dados</h2>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
          </div>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-blue-600" />
              Planejamento
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie tarefas e projetos em um board estilo Trello
            </p>
          </div>
          
          {/* Estatísticas rápidas */}
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{tarefas.length}</div>
              <div className="text-gray-600">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {tarefas.filter(t => t.coluna === 'em_andamento').length}
              </div>
              <div className="text-gray-600">Em Andamento</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {tarefas.filter(t => t.coluna === 'concluido').length}
              </div>
              <div className="text-gray-600">Concluído</div>
            </div>
          </div>
        </div>

        {/* Board Principal */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <PlanejamentoBoard
            tarefas={tarefas}
            profiles={profiles}
            onCreateTarefa={createTarefa}
            onUpdateTarefa={updateTarefa}
            loading={loading}
          />
        </div>
      </div>

      {/* Informações adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">📥 Backlog</h3>
          <div className="text-2xl font-bold text-gray-700">
            {tarefas.filter(t => t.coluna === 'backlog').length}
          </div>
          <p className="text-sm text-gray-600 mt-1">Ideias e pendências</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">🚧 Em Andamento</h3>
          <div className="text-2xl font-bold text-blue-600">
            {tarefas.filter(t => t.coluna === 'em_andamento').length}
          </div>
          <p className="text-sm text-gray-600 mt-1">Trabalhos em progresso</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">✅ Concluído</h3>
          <div className="text-2xl font-bold text-green-600">
            {tarefas.filter(t => t.coluna === 'concluido').length}
          </div>
          <p className="text-sm text-gray-600 mt-1">Tarefas finalizadas</p>
        </div>
      </div>
    </div>
  );
}
