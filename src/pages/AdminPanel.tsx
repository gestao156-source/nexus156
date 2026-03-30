import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Users, Settings, Plus, Trash2, Key, Mail } from 'lucide-react';
import RoleSelector from '../components/Admin/RoleSelector';
import CreateUserModal from '../components/Admin/CreateUserModal';
import CreateAssuntoModal from '../components/Admin/CreateAssuntoModal';
import CreatePontoModal from '../components/Admin/CreatePontoModal';
import ErrorService from '../services/errorService';

interface AssuntoPadrao {
  id: string;
  nome: string;
  created_at: string;
  updated_at: string;
}

interface PontoContato {
  id: string;
  nome: string;
  created_at: string;
  updated_at: string;
}

export default function AdminPanel() {
  const { profile } = useAuth();
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [assuntos, setAssuntos] = useState<AssuntoPadrao[]>([]);
  const [pontosContato, setPontosContato] = useState<PontoContato[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'assuntos' | 'contatos'>('users');
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showCreateAssuntoModal, setShowCreateAssuntoModal] = useState(false);
  const [showCreatePontoModal, setShowCreatePontoModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar usuários
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      
      // Carregar assuntos padrão
      const { data: assuntosData } = await supabase
        .from('assuntos_padrao')
        .select('*')
        .order('nome');
      
      // Carregar pontos de contato
      const { data: pontosData } = await supabase
        .from('pontos_contato')
        .select('*')
        .order('nome');
      
      setUsers(usersData || []);
      setAssuntos(assuntosData || []);
      setPontosContato(pontosData || []);
    } catch (error) {
      ErrorService.handleError(error, { component: 'AdminPanel', action: 'loadData' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    setShowCreateUserModal(true);
  };

  const handleUserCreated = () => {
    showSuccess('Usuário criado com sucesso!');
    loadData();
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    
    try {
      // Atualização otimista: remover do estado local imediatamente
      setUsers(prev => prev.filter(user => user.id !== userId));
      
      // Usar RPC function para deletar completamente (perfil + auth)
      const { error } = await supabase.rpc('delete_user_complete', {
        user_id_to_delete: userId
      });
      
      if (error) {
        // Se falhar, recarrega os dados para restaurar estado correto
        loadData();
        throw error;
      }
      
      showSuccess('Usuário excluído com sucesso!');
      
      // Pequeno delay para garantir processamento no Supabase
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Recarregar dados para garantir consistência
      loadData();
    } catch (error) {
      ErrorService.handleError(error, { component: 'AdminPanel', action: 'deleteUser' });
      showError('Erro ao excluir usuário');
    }
  };

  const handleResetPassword = async (userId: string, userEmail: string) => {
    const confirmed = window.confirm(
      `Deseja resetar a senha do usuário "${userEmail}" para 123456?` 
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase.functions.invoke("reset-user-password", {
        body: {
          userId,
          tempPassword: "123456",
        },
      });

      if (error) {
        throw error;
      }

      showSuccess(`Senha do usuário ${userEmail} resetada para 123456 com sucesso!`);
    } catch (error: any) {
      console.error("Erro ao resetar senha:", error);

      if (error?.context) {
        try {
          const errorBody = await error.context.json();
          showError(errorBody?.error || "Erro ao resetar senha");
          return;
        } catch (_) {}
      }

      showError(error?.message || "Erro ao resetar senha");
    }
  };

  const handleCreateAssunto = async () => {
    setShowCreateAssuntoModal(true);
  };

  const handleAssuntoCreated = () => {
    showSuccess('Assunto criado com sucesso!');
    loadData();
  };

  const handleCreatePonto = async () => {
    setShowCreatePontoModal(true);
  };

  const handlePontoCreated = () => {
    showSuccess('Ponto de contato criado com sucesso!');
    loadData();
  };

  const handleDeleteAssunto = async (assuntoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este assunto?')) return;
    
    try {
      await supabase
        .from('assuntos_padrao')
        .delete()
        .eq('id', assuntoId);
      
      showSuccess('Assunto excluído com sucesso!');
      loadData();
    } catch (error) {
      ErrorService.handleError(error, { component: 'AdminPanel', action: 'deleteAssunto' });
      showError('Erro ao excluir assunto');
    }
  };

  const handleDeletePonto = async (pontoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este ponto de contato?')) return;
    
    try {
      await supabase
        .from('pontos_contato')
        .delete()
        .eq('id', pontoId);
      
      showSuccess('Ponto de contato excluído com sucesso!');
      loadData();
    } catch (error) {
      ErrorService.handleError(error, { component: 'AdminPanel', action: 'deletePontoContato' });
      showError('Erro ao excluir ponto de contato');
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Settings className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Acesso Restrito</h2>
          <p className="text-gray-600">Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Painel Administrativo</h2>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Usuários
          </button>
          <button
            onClick={() => setActiveTab('assuntos')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'assuntos'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Settings className="w-4 h-4 mr-2" />
            Assuntos
          </button>
          <button
            onClick={() => setActiveTab('contatos')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'contatos'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <Mail className="w-4 h-4 mr-2" />
            Pontos de Contato
          </button>
        </nav>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'users' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Gerenciar Usuários</h3>
            <button
              onClick={handleCreateUser}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Novo Usuário
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <RoleSelector
                        userId={user.id}
                        currentRole={user.role}
                        userName={user.full_name}
                        onRoleUpdated={loadData}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleResetPassword(user.id, user.email)}
                          className="text-blue-600 hover:text-blue-900 text-xs"
                        >
                          <Key className="w-3 h-3" />
                          Reset
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900 text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'assuntos' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Gerenciar Assuntos Padrão</h3>
            <button
              onClick={handleCreateAssunto}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Novo Assunto
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assunto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assuntos.map((assunto) => (
                  <tr key={assunto.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{assunto.nome}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleDeleteAssunto(assunto.id)}
                        className="text-red-600 hover:text-red-900 text-xs"
                      >
                        <Trash2 className="w-3 h-3" />
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'contatos' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Gerenciar Pontos de Contato</h3>
            <button
              onClick={handleCreatePonto}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Novo Ponto
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ponto de Contato</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pontosContato.map((ponto) => (
                  <tr key={ponto.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ponto.nome}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleDeletePonto(ponto.id)}
                        className="text-red-600 hover:text-red-900 text-xs"
                      >
                        <Trash2 className="w-3 h-3" />
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Modal de Criar Usuário */}
      <CreateUserModal
        isOpen={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
        onSuccess={handleUserCreated}
      />
      
      {/* Modal de Criar Assunto */}
      <CreateAssuntoModal
        isOpen={showCreateAssuntoModal}
        onClose={() => setShowCreateAssuntoModal(false)}
        onSuccess={handleAssuntoCreated}
      />
      
      {/* Modal de Criar Ponto de Contato */}
      <CreatePontoModal
        isOpen={showCreatePontoModal}
        onClose={() => setShowCreatePontoModal(false)}
        onSuccess={handlePontoCreated}
      />
    </div>
  );
}

