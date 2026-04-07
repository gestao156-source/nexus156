import React, { useState, useCallback } from 'react';
import { Search, Plus } from 'lucide-react';
import { TarefaColuna, TarefaPlanejamentoExtendida, Profile } from '../../types';
import PlanejamentoColumn from './PlanejamentoColumn';
import PlanejamentoModal from './PlanejamentoModal';

interface PlanejamentoBoardProps {
  tarefas: TarefaPlanejamentoExtendida[];
  profiles: Profile[];
  onCreateTarefa: (data: any) => Promise<void>;
  onUpdateTarefa: (data: any) => Promise<void>;
  loading?: boolean;
}

const colunasConfig = [
  { key: 'backlog' as TarefaColuna, titulo: '📥 Backlog (ideias e pendências)' },
  { key: 'semana_atual' as TarefaColuna, titulo: '🗓️ Semana Atual' },
  { key: 'em_andamento' as TarefaColuna, titulo: '🚧 Em andamento' },
  { key: 'em_validacao' as TarefaColuna, titulo: '👀 Em validação' },
  { key: 'concluido' as TarefaColuna, titulo: '✅ Concluído' },
  { key: 'indicadores' as TarefaColuna, titulo: '📊 Indicadores' }
];

export default function PlanejamentoBoard({
  tarefas,
  profiles,
  onCreateTarefa,
  onUpdateTarefa,
  loading = false
}: PlanejamentoBoardProps) {
  const [draggedTarefa, setDraggedTarefa] = useState<TarefaPlanejamentoExtendida | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTarefa, setEditingTarefa] = useState<TarefaPlanejamentoExtendida | undefined>();
  const [colunaInicial, setColunaInicial] = useState<TarefaColuna>('backlog');
  const [dragOverColumn, setDragOverColumn] = useState<TarefaColuna | null>(null);
  const [busca, setBusca] = useState('');

  // Agrupar tarefas por coluna
  const tarefasPorColuna = useCallback(() => {
    const agrupadas: Record<TarefaColuna, TarefaPlanejamentoExtendida[]> = {
      backlog: [],
      semana_atual: [],
      em_andamento: [],
      em_validacao: [],
      concluido: [],
      indicadores: []
    };

    // Filtrar por busca se houver
    const tarefasFiltradas = busca.trim()
      ? tarefas.filter(tarefa =>
          tarefa.titulo.toLowerCase().includes(busca.toLowerCase()) ||
          tarefa.descricao?.toLowerCase().includes(busca.toLowerCase()) ||
          tarefa.tags?.some(tag => tag.toLowerCase().includes(busca.toLowerCase()))
        )
      : tarefas;

    // Agrupar por coluna e ordenar
    tarefasFiltradas.forEach(tarefa => {
      agrupadas[tarefa.coluna].push(tarefa);
    });

    // Ordenar por ordem e depois por data de criação
    Object.keys(agrupadas).forEach(coluna => {
      agrupadas[coluna as TarefaColuna].sort((a, b) => {
        if (a.ordem !== b.ordem) {
          return a.ordem - b.ordem;
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    });

    return agrupadas;
  }, [tarefas, busca]);

  const handleDragStart: React.DragEventHandler<HTMLDivElement> = (e) => {
    const tarefaId = e.currentTarget.getAttribute('data-tarefa-id');
    if (tarefaId) {
      const tarefa = tarefas.find(t => t.id === tarefaId);
      if (tarefa) {
        setDraggedTarefa(tarefa);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', tarefa.id);
      }
    }
  };

  const handleDrop: React.DragEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedTarefa) return;

    // Tentar obter coluna de destino de múltiplas formas
    let colunaDestino = e.currentTarget.getAttribute('data-coluna') as TarefaColuna;
    
    // Se não encontrar no current, tentar no target
    if (!colunaDestino && e.target) {
      const target = e.target as HTMLElement;
      colunaDestino = target.closest('[data-coluna]')?.getAttribute('data-coluna') as TarefaColuna;
    }

    if (colunaDestino && colunaDestino !== draggedTarefa.coluna) {
      try {
        // Obter próxima ordem na coluna de destino
        const tarefasNaColuna = tarefas.filter(t => t.coluna === colunaDestino);
        const novaOrdem = Math.max(...tarefasNaColuna.map(t => t.ordem), -1) + 1;
        
        // Atualizar tarefa com nova coluna e ordem
        await onUpdateTarefa({
          id: draggedTarefa.id,
          coluna: colunaDestino,
          ordem: novaOrdem
        });
      } catch (error) {
        console.error('Erro ao mover tarefa:', error);
      }
    }

    setDraggedTarefa(null);
  };

  const handleDragEnter = (coluna: TarefaColuna) => {
    setDragOverColumn(coluna);
  };

  
  const handleAddTarefa = (coluna: TarefaColuna) => {
    setEditingTarefa(undefined);
    setColunaInicial(coluna);
    setModalOpen(true);
  };

  const handleEditTarefa = (tarefa: TarefaPlanejamentoExtendida) => {
    setEditingTarefa(tarefa);
    setModalOpen(true);
  };

  const handleSaveTarefa = async (data: any) => {
    try {
      // Verificar se é ação de exclusão
      if (data.action === 'delete') {
        await onUpdateTarefa({ action: 'delete', id: data.id });
        return;
      }

      // Ação normal de criar/editar
      if (editingTarefa) {
        await onUpdateTarefa({ ...data, id: editingTarefa.id });
      } else {
        await onCreateTarefa(data);
      }
      setModalOpen(false);
      setEditingTarefa(undefined);
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
    }
  };

  const agrupadas = tarefasPorColuna();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com busca e ações */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* Busca */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar tarefas..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Botão de adicionar */}
          <button
            onClick={() => handleAddTarefa('backlog')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </button>
        </div>

        {/* Estatísticas rápidas */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Total: {tarefas.length}</span>
          <span>Em andamento: {agrupadas.em_andamento.length}</span>
          <span>Concluído: {agrupadas.concluido.length}</span>
        </div>
      </div>

      {/* Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {colunasConfig.map(({ key, titulo }) => (
          <div
            key={key}
            className="flex-shrink-0 w-80"
            onDragEnter={() => handleDragEnter(key)}
          >
            <PlanejamentoColumn
              titulo={titulo}
              coluna={key}
              tarefas={agrupadas[key]}
              onAddTarefa={handleAddTarefa}
              onEditTarefa={handleEditTarefa}
              onDrop={handleDrop}
              onDragStart={handleDragStart}
              isDraggingOver={dragOverColumn === key}
              data-coluna={key}
            />
          </div>
        ))}
      </div>

      {/* Modal */}
      <PlanejamentoModal
        tarefa={editingTarefa}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveTarefa}
        profiles={profiles}
        colunaInicial={colunaInicial}
      />
    </div>
  );
}
