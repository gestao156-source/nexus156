import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, User, Tag, Flag, FileText, Trash2 } from 'lucide-react';
import { 
  TarefaPlanejamentoExtendida, 
  TarefaColuna, 
  TarefaEtiqueta, 
  TarefaPrioridade,
  Profile 
} from '../../types';
import EtiquetaBadge from './EtiquetaBadge';

interface PlanejamentoModalProps {
  tarefa?: TarefaPlanejamentoExtendida;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  profiles: Profile[];
  colunaInicial?: TarefaColuna;
}

const colunas: { value: TarefaColuna; label: string }[] = [
  { value: 'backlog', label: '📥 Backlog (ideias e pendências)' },
  { value: 'em_andamento', label: '🚧 Em andamento' },
  { value: 'em_validacao', label: '👀 Em validação' },
  { value: 'concluido', label: '✅ Concluído' }
];

const etiquetas: { value: TarefaEtiqueta; label: string }[] = [
  { value: 'diagnostico', label: '🔵 Diagnóstico' },
  { value: 'padronizacao', label: '🟡 Padronização' },
  { value: 'capacitacao', label: '🟢 Capacitação' },
  { value: 'monitoramento', label: '🔴 Monitoramento' }
];

const prioridades: { value: TarefaPrioridade; label: string }[] = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' }
];

export default function PlanejamentoModal({
  tarefa,
  isOpen,
  onClose,
  onSave,
  profiles,
  colunaInicial
}: PlanejamentoModalProps) {
  const [formData, setFormData] = useState({
    titulo: tarefa?.titulo || '',
    descricao: tarefa?.descricao || '',
    coluna: tarefa?.coluna || colunaInicial || 'backlog',
    etiqueta: tarefa?.etiqueta || '',
    responsavel_id: tarefa?.responsavel_id || '',
    prioridade: tarefa?.prioridade || 'media',
    data_inicio: tarefa?.data_inicio || new Date().toISOString().split('T')[0],
    data_limite: tarefa?.data_limite || '',
    data_conclusao: tarefa?.data_conclusao || '',
    tags: tarefa?.tags?.join(', ') || ''
  });

  // Resetar form quando a tarefa mudar (para edição vs criação)
  React.useEffect(() => {
    if (tarefa) {
      // Modo edição - usar dados da tarefa
      setFormData({
        titulo: tarefa.titulo || '',
        descricao: tarefa.descricao || '',
        coluna: tarefa.coluna || colunaInicial || 'backlog',
        etiqueta: tarefa.etiqueta || '',
        responsavel_id: tarefa.responsavel_id || '',
        prioridade: tarefa.prioridade || 'media',
        data_inicio: tarefa.data_inicio || '',
        data_limite: tarefa.data_limite || '',
        data_conclusao: tarefa.data_conclusao || '',
        tags: tarefa.tags?.join(', ') || ''
      });
    } else {
      // Modo criação - data atual automática
      setFormData({
        titulo: '',
        descricao: '',
        coluna: colunaInicial || 'backlog',
        etiqueta: '',
        responsavel_id: '',
        prioridade: 'media',
        data_inicio: new Date().toISOString().split('T')[0],
        data_limite: '',
        data_conclusao: '',
        tags: ''
      });
    }
  }, [tarefa, colunaInicial]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Fechar modal ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Fechar modal ao clicar fora (backdrop)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDelete = async () => {
    if (!tarefa) return;
    
    try {
      await onSave({ 
        action: 'delete',
        id: tarefa.id 
      });
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação
    const newErrors: Record<string, string> = {};
    if (!formData.titulo.trim()) {
      newErrors.titulo = 'Título é obrigatório';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    
    const data = {
      ...formData,
      responsavel_id: formData.responsavel_id || null, // Converter string vazia para null
      tags: formData.tags ? formData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : []
    };

    try {
      if (tarefa) {
        await onSave({ ...data, id: tarefa.id });
      } else {
        await onSave(data);
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div ref={modalRef} className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {tarefa ? 'Editar Tarefa' : 'Nova Tarefa'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Título */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4" />
              Título *
            </label>
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) => handleChange('titulo', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.titulo ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Digite o título da tarefa"
            />
            {errors.titulo && (
              <p className="mt-1 text-sm text-red-600">{errors.titulo}</p>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => handleChange('descricao', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descreva detalhes da tarefa (opcional)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Coluna */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Coluna
              </label>
              <select
                value={formData.coluna}
                onChange={(e) => handleChange('coluna', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {colunas.map(col => (
                  <option key={col.value} value={col.value}>
                    {col.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Prioridade */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Flag className="w-4 h-4" />
                Prioridade
              </label>
              <select
                value={formData.prioridade}
                onChange={(e) => handleChange('prioridade', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {prioridades.map(pri => (
                  <option key={pri.value} value={pri.value}>
                    {pri.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Etiqueta */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Tag className="w-4 h-4" />
              Etiqueta
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleChange('etiqueta', '')}
                className={`px-3 py-2 rounded-lg border-2 transition-all ${
                  !formData.etiqueta
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                Nenhuma
              </button>
              {etiquetas.map(etiqueta => (
                <button
                  key={etiqueta.value}
                  type="button"
                  onClick={() => handleChange('etiqueta', etiqueta.value)}
                  className={`px-3 py-2 rounded-lg border-2 transition-all ${
                    formData.etiqueta === etiqueta.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <EtiquetaBadge etiqueta={etiqueta.value} size="sm" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Responsável */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4" />
                Responsável
              </label>
              <select
                value={formData.responsavel_id}
                onChange={(e) => handleChange('responsavel_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sem responsável</option>
                {profiles
                  .sort((a, b) => a.full_name.localeCompare(b.full_name))
                  .map(profile => (
                    <option key={profile.id} value={profile.id}>
                      {profile.full_name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Tags
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => handleChange('tags', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="tag1, tag2, tag3"
              />
              <p className="mt-1 text-xs text-gray-500">
                Separe as tags com vírgula
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Data Início */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4" />
                Data Início
              </label>
              <input
                type="date"
                value={formData.data_inicio}
                onChange={(e) => handleChange('data_inicio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Data Limite */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4" />
                Data Limite
              </label>
              <input
                type="date"
                value={formData.data_limite}
                onChange={(e) => handleChange('data_limite', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Data Conclusão */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4" />
                Data Conclusão
              </label>
              <input
                type="date"
                value={formData.data_conclusao}
                onChange={(e) => handleChange('data_conclusao', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={formData.coluna !== 'concluido'}
              />
              {formData.coluna !== 'concluido' && (
                <p className="mt-1 text-xs text-gray-500">Disponível apenas para tarefas concluídas</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t">
            <div>
              {tarefa && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                {tarefa ? 'Salvar' : 'Criar'} Tarefa
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirmar Exclusão</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Tem certeza que deseja excluir a tarefa "{tarefa?.titulo}"? Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
