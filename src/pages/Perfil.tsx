import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import ErrorService from '../services/errorService';
import PasswordChangeSection from '../components/PasswordChangeSection';

export default function Perfil() {
  const { profile, user, loading, updateProfile } = useAuth();
  const { showSuccess, showError } = useToast();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    if (!user) {
      showError('Erro de autenticação', 'Usuário não autenticado');
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (error) throw error;
      
      // Atualizar perfil localmente
      updateProfile({ full_name: fullName });
      showSuccess('Perfil atualizado!', 'Seu nome foi atualizado com sucesso');
    } catch (err: any) {
      ErrorService.handleError(err, { component: 'Perfil', action: 'updateProfile' });
      showError('Erro ao atualizar', 'Não foi possível salvar as alterações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Meu Perfil</h2>
      
      {/* Seção de Dados Pessoais */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados Pessoais</h3>

        {error && <p className="text-red-600 mb-2">{error}</p>}
        {success && <p className="text-green-600 mb-2">{success}</p>}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">E-mail (leitura)</label>
          <input
            type="email"
            value={profile?.email || ''}
            readOnly
            className="w-full border border-gray-200 rounded bg-gray-100 px-3 py-2"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Role / Perfil (leitura)</label>
          <input
            type="text"
            value={profile?.role || ''}
            readOnly
            className="w-full border border-gray-200 rounded bg-gray-100 px-3 py-2"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      {/* Seção de Segurança */}
      <PasswordChangeSection />
    </div>
  );
}