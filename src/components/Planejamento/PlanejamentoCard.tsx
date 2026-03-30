import React from 'react';
import { Calendar, User, AlertCircle, MessageSquare, GripVertical } from 'lucide-react';
import { TarefaPlanejamentoExtendida, TarefaPrioridade } from '../../types';
import EtiquetaBadge from './EtiquetaBadge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PlanejamentoCardProps {
  tarefa: TarefaPlanejamentoExtendida;
  onEdit: (tarefa: TarefaPlanejamentoExtendida) => void;
  isDragging?: boolean;
}

const prioridadeConfig = {
  baixa: { cor: 'text-gray-500', nome: 'Baixa' },
  media: { cor: 'text-blue-500', nome: 'Média' },
  alta: { cor: 'text-orange-500', nome: 'Alta' },
  urgente: { cor: 'text-red-500', nome: 'Urgente' }
};

export default function PlanejamentoCard({ tarefa, onEdit, isDragging }: PlanejamentoCardProps) {
  const prioridade = prioridadeConfig[tarefa.prioridade];
  const temPrazo = tarefa.data_limite;
  const atrasado = temPrazo && new Date(tarefa.data_limite!) < new Date() && tarefa.coluna !== 'concluido';
  const temComentarios = tarefa.comentarios && tarefa.comentarios.length > 0;

  const handleClick = () => {
    onEdit(tarefa);
  };

  return (
    <div
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer
        hover:shadow-md hover:border-gray-300 transition-all duration-200
        ${isDragging ? 'opacity-50 rotate-2' : ''}
        ${atrasado ? 'border-l-4 border-l-red-500' : ''}
      `}
      onClick={handleClick}
    >
      {/* Cabeçalho */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-2 flex-1">
          <GripVertical className="w-4 h-4 text-gray-400 mt-0.5 cursor-grab" />
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 text-sm leading-tight mb-1">
              {tarefa.titulo}
            </h3>
            {tarefa.descricao && (
              <p className="text-xs text-gray-600 line-clamp-2">
                {tarefa.descricao}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Etiqueta e Prioridade */}
      <div className="flex items-center gap-2 mb-3">
        {tarefa.etiqueta && <EtiquetaBadge etiqueta={tarefa.etiqueta} size="sm" />}
        <span className={`text-xs font-medium ${prioridade.cor}`}>
          {prioridade.nome}
        </span>
      </div>

      {/* Tags */}
      {tarefa.tags && tarefa.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {tarefa.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
            >
              {tag}
            </span>
          ))}
          {tarefa.tags.length > 3 && (
            <span className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
              +{tarefa.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Informações */}
      <div className="space-y-2">
        {/* Criador */}
        {tarefa.criador_nome && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="font-medium">Criado por:</span>
            <span>{tarefa.criador_nome}</span>
          </div>
        )}
        
        {/* Responsável */}
        {tarefa.responsavel_nome && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <User className="w-3 h-3" />
            <span>{tarefa.responsavel_nome}</span>
          </div>
        )}
        
        {/* Prazo */}
        {temPrazo && (
          <div className={`
            flex items-center gap-2 text-xs
            ${atrasado ? 'text-red-600 font-medium' : 'text-gray-600'}
          `}>
            <Calendar className="w-3 h-3" />
            <span>
              {format(new Date(tarefa.data_limite!), "dd 'de' MMMM", { locale: ptBR })}
            </span>
            {atrasado && <AlertCircle className="w-3 h-3" />}
          </div>
        )}
        
        {/* Comentários */}
        {temComentarios && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <MessageSquare className="w-3 h-3" />
            <span>{tarefa.comentarios!.length} comentários</span>
          </div>
        )}
      </div>

      {/* Indicadores visuais */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          {format(new Date(tarefa.created_at), "dd/MM/yyyy", { locale: ptBR })}
        </span>
        
        {/* Indicador de arrastar */}
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
