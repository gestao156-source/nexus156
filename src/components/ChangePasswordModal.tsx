import { useState } from 'react';
import { X, Eye, EyeOff, Key } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import ErrorService from '../services/errorService';
import LoadingButton from './UI/LoadingButton';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  showCurrentPassword?: boolean;
}

export default function ChangePasswordModal({ 
  isOpen, 
  onClose, 
  title = "Alterar Senha",
  showCurrentPassword = false 
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (showCurrentPassword && !currentPassword) {
      showError('Campo obrigatório', 'Digite a senha atual');
      return;
    }
    
    if (!newPassword) {
      showError('Campo obrigatório', 'Digite a nova senha');
      return;
    }
    
    if (newPassword.length < 4) {
      showError('Senha muito curta', 'A senha deve ter pelo menos 4 caracteres');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showError('Senhas diferentes', 'A nova senha e a confirmação devem ser iguais');
      return;
    }

    setLoading(true);
    try {
      // Usar Auth API direta para alterar senha
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword.trim()
      });

      if (error) {
        ErrorService.handleError(error, { component: 'ChangePasswordModal', action: 'updatePassword' });
        showError('Erro ao alterar senha', error.message || 'Não foi possível alterar a senha');
        return;
      }

      if (data) {
        showSuccess('Senha alterada!', 'Sua senha foi atualizada com sucesso');
        handleClose();
      } else {
        showError('Erro ao alterar senha', 'Não foi possível alterar a senha');
      }
    } catch (error: any) {
      ErrorService.handleError(error, { component: 'ChangePasswordModal', action: 'updatePassword' });
      showError('Erro de conexão', error.message || 'Falha na comunicação com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
         onClick={handleClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full"
           onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Key className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">Digite sua nova senha</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {showCurrentPassword && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha Atual
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite sua senha atual"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nova Senha
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite a nova senha"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirme a nova senha"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <LoadingButton
              type="button"
              onClick={handleClose}
              variant="secondary"
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </LoadingButton>
            <LoadingButton
              type="submit"
              loading={loading}
              className="flex-1"
            >
              {loading ? 'Alterando...' : 'Alterar Senha'}
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
}
