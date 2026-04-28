import React from 'react';
import { Plus } from 'lucide-react';
import { TarefaColuna, TarefaPlanejamentoExtendida } from '../../types';
import PlanejamentoCard from './PlanejamentoCard';

interface PlanejamentoColumnProps {
  titulo: string;
  coluna: TarefaColuna;
  tarefas: TarefaPlanejamentoExtendida[];
  onAddTarefa: (coluna: TarefaColuna) => void;
  onEditTarefa: (tarefa: TarefaPlanejamentoExtendida) => void;
  onDrop: React.DragEventHandler<HTMLDivElement>;
  onDragStart: React.DragEventHandler<HTMLDivElement>;
  isDraggingOver?: boolean;
  'data-coluna'?: TarefaColuna;
}

const colunaConfig = {
  backlog: {
    cor: 'border-gray-300 bg-gray-50',
    corHeader: 'bg-gray-100 text-gray-700'
  },
  em_andamento: {
    cor: 'border-yellow-300 bg-yellow-50',
    corHeader: 'bg-yellow-100 text-yellow-700'
  },
  em_validacao: {
    cor: 'border-purple-300 bg-purple-50',
    corHeader: 'bg-purple-100 text-purple-700'
  },
  concluido: {
    cor: 'border-green-300 bg-green-50',
    corHeader: 'bg-green-100 text-green-700'
  }
};

export default function PlanejamentoColumn({
  titulo,
  coluna,
  tarefas,
  onAddTarefa,
  onEditTarefa,
  onDrop,
  onDragStart,
  isDraggingOver = false
}: PlanejamentoColumnProps) {
  const config = colunaConfig[coluna];

  const handleDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className={`
        flex-1 min-w-0 border-2 border-dashed rounded-xl
        ${config.cor}
        ${isDraggingOver ? 'border-solid ring-2 ring-blue-400 ring-opacity-50' : ''}
        transition-all duration-200
      `}
      data-coluna={coluna}
      onDrop={onDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      {/* Header */}
      <div className={`
        px-4 py-3 border-b rounded-t-xl
        ${config.corHeader}
      `}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{titulo}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium bg-white bg-opacity-60 px-2 py-1 rounded-full">
              {tarefas.length}
            </span>
            <button
              onClick={() => onAddTarefa(coluna)}
              className="p-1 hover:bg-white hover:bg-opacity-60 rounded transition-colors"
              title="Adicionar tarefa"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Tarefas */}
      <div className="p-3 space-y-3 min-h-[400px] max-h-[600px] overflow-y-auto">
        {tarefas.map((tarefa) => (
          <div
            key={tarefa.id}
            draggable
            onDragStart={onDragStart}
            className="transform transition-transform hover:scale-[1.02]"
            data-tarefa-id={tarefa.id}
          >
            <PlanejamentoCard
              tarefa={tarefa}
              onEdit={onEditTarefa}
            />
          </div>
        ))}

        {/* Placeholder quando vazio */}
        {tarefas.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 text-sm mb-2">
              Nenhuma tarefa nesta coluna
            </div>
            <button
              onClick={() => onAddTarefa(coluna)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Adicionar primeira tarefa
            </button>
          </div>
        )}

        {/* Botão flutuante de adicionar */}
        {tarefas.length > 0 && (
          <button
            onClick={() => onAddTarefa(coluna)}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4 inline mr-1" />
            Adicionar tarefa
          </button>
        )}
      </div>
    </div>
  );
}
