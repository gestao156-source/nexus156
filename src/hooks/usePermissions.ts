import { useAuth } from '../contexts/AuthContext';
import { KanbanItem } from '../types/index';

export const usePermissions = () => {
  const { profile, user } = useAuth();
  
  const canEdit = (item: KanbanItem) => {
    // Admin pode editar tudo
    if (profile?.role === 'admin') return true;
    
    // Usuário só pode editar se for o criador do item
    return item.user_id === user?.id;
  };
  
  const isOwner = (item: KanbanItem) => {
    return item.user_id === user?.id;
  };
  
  return { canEdit, isOwner, isAdmin: profile?.role === 'admin' };
};
