import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { ItemStatus, KanbanItem } from '../../types/index';
import KanbanColumn from './KanbanColumn';
import ItemModal from './ItemModal';
import { usePermissions } from '../../hooks/usePermissions';
import { supabase } from '../../lib/supabase';

interface Profile {
  id: string;
  full_name: string;
  email: string;
}

interface KanbanBoardProps {
  items: KanbanItem[];
  type: 'solicitacoes' | 'demandas';
  onRefresh: () => void;
}

export default function KanbanBoard({ items, type, onRefresh }: KanbanBoardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KanbanItem | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const { canEdit } = usePermissions();

  // Buscar perfis para exibir nomes dos responsáveis
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

  // Função para obter nome do responsável (com fallback robusto)
  const getResponsavelName = (responsavelValue: string) => {
    // Se for vazio ou nulo, retornar padrão
    if (!responsavelValue) return 'Não informado';
    
    // Se for UUID (formato xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx), tentar buscar nome
    if (responsavelValue.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const profile = profiles.find(p => p.id === responsavelValue);
      if (profile?.full_name) return profile.full_name;
    }
    
    // Se não for UUID ou não encontrar profile, retornar como está (pode ser nome já salvo)
    return responsavelValue;
  };

  const columns: { status: ItemStatus; title: string; color: string }[] = [
    { status: 'aguardando', title: 'Aguardando Análise', color: 'bg-yellow-50 border-yellow-200' },
    { status: 'em_analise', title: 'Em Análise', color: 'bg-blue-50 border-blue-200' },
    { status: 'finalizado', title: 'Finalizado', color: 'bg-green-50 border-green-200' },
  ];

  // Editar com base nas permissões
  const handleEdit = (item: KanbanItem) => {
    if (!canEdit(item)) {
      // Usuário não pode editar - mostrar mensagem
      return;
    }
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Visualizar sempre permitido
  const handleView = (item: KanbanItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Verificar se o modal deve abrir em modo visualização
  const getIsViewMode = () => {
    if (!editingItem) return false; // Novo item sempre é edição
    return !canEdit(editingItem); // Item existente é visualização se não pode editar
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = () => {
    onRefresh();
    handleCloseModal();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {type === 'solicitacoes' ? 'Solicitações' : 'Demandas'}
          </h2>
          <p className="text-gray-600">
            Gerencie {type === 'solicitacoes' ? 'as solicitações' : 'as demandas'} do sistema
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          <span>Adicionar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => (
          <KanbanColumn
            key={column.status}
            title={column.title}
            color={column.color}
            items={items.filter((item) => item.status === column.status)}
            onEdit={handleEdit}
            onView={handleView}
            getResponsavelName={getResponsavelName}
          />
        ))}
      </div>

      {isModalOpen && (
        <ItemModal
          type={type}
          item={editingItem}
          onClose={handleCloseModal}
          onSave={handleSave}
          isViewMode={getIsViewMode()}
        />
      )}
    </div>
  );
}