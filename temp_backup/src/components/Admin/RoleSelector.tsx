import { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

interface RoleSelectorProps {
  userId: string;
  currentRole: string;
  userName: string;
  onRoleUpdated: () => void;
}

export default function RoleSelector({ userId, currentRole, userName, onRoleUpdated }: RoleSelectorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError, showInfo } = useToast();

  const handleSave = async () => {
    if (selectedRole === currentRole) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('update_user_role', {
        user_id: userId,
        new_role: selectedRole
      });

      if (error) {
        console.error('Error updating role:', error);
        showError('Erro ao atualizar', error.message || 'Não foi possível alterar o role');
        return;
      }

      if (data) {
        showSuccess('Role atualizado', `Role de ${userName} alterado para ${selectedRole}`);
        onRoleUpdated();
        setIsEditing(false);
      } else {
        showError('Erro ao atualizar', 'Não foi possível alterar o role');
      }
    } catch (error: any) {
      console.error('Error updating role:', error);
      showError('Erro de conexão', error.message || 'Falha na comunicação com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedRole(currentRole);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setSelectedRole(currentRole);
    setIsEditing(true);
  };

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2">
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        
        <button
          onClick={handleSave}
          disabled={loading}
          className="text-green-600 hover:text-green-800 disabled:opacity-50"
          title="Salvar"
        >
          <Check className="w-4 h-4" />
        </button>
        
        <button
          onClick={handleCancel}
          disabled={loading}
          className="text-red-600 hover:text-red-800 disabled:opacity-50"
          title="Cancelar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <span className={`px-2 py-1 text-xs rounded-full ${
        currentRole === 'admin' 
          ? 'bg-orange-100 text-orange-800' 
          : 'bg-gray-100 text-gray-800'
      }`}>
        {currentRole}
      </span>
      
      <button
        onClick={handleEdit}
        className="text-blue-600 hover:text-blue-800"
        title="Editar role"
      >
        <Edit2 className="w-3 h-3" />
      </button>
    </div>
  );
}
