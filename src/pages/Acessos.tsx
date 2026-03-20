import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Acesso, AcessoStatus } from '../types/index';
import ErrorService from '../services/errorService';
import AcessoForm from '../components/Acessos/AcessoForm';
import AcessoCard from '../components/Acessos/AcessoCard';

export default function Acessos() {
  const [acessos, setAcessos] = useState<Acesso[]>([]);
  const [loading, setLoading] = useState(true);
  const [responsaveisFiltro, setResponsaveisFiltro] = useState<string[]>([]);
  const [statusFiltro, setStatusFiltro] = useState<AcessoStatus[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [acessoEditando, setAcessoEditando] = useState<Acesso | null>(null);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    loadAcessos();
  }, [responsaveisFiltro, statusFiltro, busca]);

  const loadAcessos = async () => {
    try {
      let query = supabase
        .from('acessos')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (responsaveisFiltro.length > 0) {
        query = query.in('responsavel_nexus', responsaveisFiltro);
      }

      if (statusFiltro.length > 0) {
        query = query.in('status', statusFiltro);
      }

      if (busca) {
        query = query.or(`
          solicitante_wpp.ilike.%${busca}%, 
          servidor_beneficiado.ilike.%${busca}%, 
          regional.ilike.%${busca}%, 
          setor.ilike.%${busca}%
        `);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAcessos(data || []);
    } catch (error) {
      ErrorService.handleError(error, { component: 'Acessos', action: 'loadAcessos' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (acesso: Partial<Acesso> & { procedimentos_iniciais?: string[] }) => {
    try {
      if (acesso.id) {
        // Verificar se o status foi alterado
        const acessoOriginal = acessos.find(a => a.id === acesso.id);
        const statusAlterado = acessoOriginal && acessoOriginal.status !== acesso.status;

        // Editar
        const { error } = await supabase
          .from('acessos')
          .update({
            ...acesso,
            updated_at: new Date().toISOString()
          })
          .eq('id', acesso.id);

        if (error) throw error;

        // Adicionar procedimento de atualização
        await adicionarProcedimentoAtualizacao(acesso.id, acesso);

        // Se o status foi alterado, adicionar ao histórico automaticamente
        if (statusAlterado && acessoOriginal && acesso.status) {
          await adicionarMudancaStatusAutomatica(acesso.id, acessoOriginal.status, acesso.status);
        }
      } else {
        // Criar
        const { data: novoAcesso, error } = await supabase
          .from('acessos')
          .insert({
            ...acesso,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;

        // Adicionar procedimento de criação
        await adicionarProcedimentoCriacao(novoAcesso.id, acesso);

        // Se há procedimentos iniciais, adicioná-los ao histórico
        if (acesso.procedimentos_iniciais && acesso.procedimentos_iniciais.length > 0 && novoAcesso) {
          await adicionarProcedimentosIniciais(novoAcesso.id, acesso.procedimentos_iniciais);
        }
      }

      await loadAcessos();
      setShowForm(false);
      setAcessoEditando(null);
    } catch (error) {
      ErrorService.handleError(error, { component: 'Acessos', action: 'handleSave' });
    }
  };

  const adicionarProcedimentoCriacao = async (acessoId: string, acesso: Partial<Acesso>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obter profile do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      // Criar mensagem de criação detalhada
      const mensagemCriacao = `📋 **Iniciando tramitação do acesso SISGEP**
      
**Solicitante:** ${acesso.solicitante_wpp || 'Não informado'}
**Servidor Beneficiado:** ${acesso.servidor_beneficiado || 'Não informado'}
**Regional:** ${acesso.regional || 'Não informada'}
**Setor:** ${acesso.setor || 'Não informado'}
**Status Inicial:** ${formatarStatusTexto(acesso.status || 'solicitado')}
**Responsável NEXUS:** ${acesso.responsavel_nexus || 'Não informado'}

Acesso criado com sucesso. Iniciando processo de tramitação para liberação do acesso ao SISGEP.`;

      // Adicionar ao histórico
      await supabase.rpc('adicionar_historico_acesso', {
        p_acesso_id: acessoId,
        p_procedimento: mensagemCriacao,
        p_usuario_id: user.id,
        p_usuario_nome: profile.full_name,
        p_usuario_email: profile.email
      });
    } catch (error) {
      console.error('Erro ao adicionar procedimento de criação:', error);
    }
  };

  const adicionarProcedimentoAtualizacao = async (acessoId: string, acesso: Partial<Acesso>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obter profile do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      // Criar mensagem de atualização
      const mensagemAtualizacao = `🔄 **Atualizando tramitação do acesso SISGEP**
      
**Servidor Beneficiado:** ${acesso.servidor_beneficiado || 'Não informado'}
**Status Atual:** ${formatarStatusTexto(acesso.status || 'solicitado')}
**Responsável NEXUS:** ${acesso.responsavel_nexus || 'Não informado'}

Dados do acesso foram atualizados. Continuando tramitação para liberação do acesso ao SISGEP.`;

      // Adicionar ao histórico
      await supabase.rpc('adicionar_historico_acesso', {
        p_acesso_id: acessoId,
        p_procedimento: mensagemAtualizacao,
        p_usuario_id: user.id,
        p_usuario_nome: profile.full_name,
        p_usuario_email: profile.email
      });
    } catch (error) {
      console.error('Erro ao adicionar procedimento de atualização:', error);
    }
  };

  const adicionarMudancaStatusAutomatica = async (acessoId: string, statusAnterior: string, statusNovo: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obter profile do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      // Format mensagem de mudança de status
      const mensagemStatus = `Status alterado de "${formatarStatusTexto(statusAnterior)}" para "${formatarStatusTexto(statusNovo)}"`;

      // Adicionar ao histórico
      await supabase.rpc('adicionar_historico_acesso', {
        p_acesso_id: acessoId,
        p_procedimento: mensagemStatus,
        p_usuario_id: user.id,
        p_usuario_nome: profile.full_name,
        p_usuario_email: profile.email
      });
    } catch (error) {
      console.error('Erro ao adicionar mudança de status ao histórico:', error);
    }
  };

  const formatarStatusTexto = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  const adicionarProcedimentosIniciais = async (acessoId: string, procedimentos: string[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obter profile do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      // Adicionar cada procedimento ao histórico
      for (const procedimento of procedimentos) {
        await supabase.rpc('adicionar_historico_acesso', {
          p_acesso_id: acessoId,
          p_procedimento: procedimento.trim(),
          p_usuario_id: user.id,
          p_usuario_nome: profile.full_name,
          p_usuario_email: profile.email
        });
      }
    } catch (error) {
      console.error('Erro ao adicionar procedimentos iniciais:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este acesso?')) return;

    try {
      const { error } = await supabase
        .from('acessos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadAcessos();
    } catch (error) {
      ErrorService.handleError(error, { component: 'Acessos', action: 'handleDelete' });
    }
  };

  const handleEdit = (acesso: Acesso) => {
    setAcessoEditando(acesso);
    setShowForm(true);
  };

  const getUniqueResponsaveis = () => {
    const responsaveis = new Set(acessos.map(a => a.responsavel_nexus).filter(Boolean));
    return Array.from(responsaveis) as string[];
  };

  const getStatusOptions = (): AcessoStatus[] => {
    return ['solicitado', 'em_andamento', 'criado', 'ativo', 'desativado'];
  };

  const getStatusColor = (status: AcessoStatus) => {
    switch (status) {
      case 'solicitado': return 'bg-yellow-100 text-yellow-800';
      case 'em_andamento': return 'bg-blue-100 text-blue-800';
      case 'criado': return 'bg-purple-100 text-purple-800';
      case 'ativo': return 'bg-green-100 text-green-800';
      case 'desativado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Acessos SISGEP</h1>
          <p className="text-gray-600 mt-1">Gerencie as solicitações de acesso recebidas via WhatsApp</p>
        </div>
        <button
          onClick={() => {
            setAcessoEditando(null);
            setShowForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Novo Acesso
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por solicitante, servidor..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Responsável NEXUS</label>
            <select
              multiple
              value={responsaveisFiltro}
              onChange={(e) => setResponsaveisFiltro(Array.from(e.target.selectedOptions, option => option.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              size={1}
            >
              {getUniqueResponsaveis().map(responsavel => (
                <option key={responsavel} value={responsavel}>
                  {responsavel}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Ctrl+Click para múltiplos</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              multiple
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(Array.from(e.target.selectedOptions, option => option.value as AcessoStatus))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              size={1}
            >
              {getStatusOptions().map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Ctrl+Click para múltiplos</p>
          </div>
        </div>
      </div>

      {/* Lista de Acessos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {acessos.map((acesso) => (
          <AcessoCard
            key={acesso.id}
            acesso={acesso}
            onEdit={handleEdit}
            onDelete={handleDelete}
            getStatusColor={getStatusColor}
          />
        ))}
      </div>

      {acessos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhum acesso encontrado</p>
        </div>
      )}

      {/* Modal Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {acessoEditando ? 'Editar Acesso' : 'Novo Acesso'}
              </h2>
              
              <AcessoForm
                acesso={acessoEditando}
                onSave={handleSave}
                onCancel={() => {
                  setShowForm(false);
                  setAcessoEditando(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
