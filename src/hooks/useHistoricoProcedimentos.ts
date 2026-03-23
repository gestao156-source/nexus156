import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Logger from '../utils/logger';

export interface Procedimento {
  id: string;
  procedimento: string;
  usuario_id: string;
  usuario_nome: string;
  usuario_email: string;
  created_at: string;
}

export interface UseHistoricoProcedimentosProps {
  itemId: string;
  itemTipo: 'solicitacao' | 'demanda' | 'acesso';
}

export function useHistoricoProcedimentos({ itemId, itemTipo }: UseHistoricoProcedimentosProps) {
  const [historico, setHistorico] = useState<Procedimento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [adicionando, setAdicionando] = useState(false);

  // Carregar histórico do item
  const carregarHistorico = async () => {
    if (!itemId) return;

    setLoading(true);
    setError('');

    try {
      let data, error;
      
      if (itemTipo === 'acesso') {
        // Usar a função específica para acessos
        const result = await supabase.rpc('obter_historico_acessos', {
          p_acesso_id: itemId
        });
        data = result.data;
        error = result.error;
      } else {
        // Usar a função existente para solicitacoes/demandas
        const result = await supabase.rpc('obter_historico_procedimentos', {
          p_item_id: itemId,
          p_item_tipo: itemTipo
        });
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      setHistorico(data || []);
    } catch (err) {
      Logger.error('Erro ao carregar histórico', { err }, 'useHistoricoProcedimentos', false);
      setError('Não foi possível carregar o histórico de procedimentos.');
    } finally {
      setLoading(false);
    }
  };

  // Adicionar novo procedimento
  const adicionarProcedimento = async (procedimento: string): Promise<boolean> => {
    if (!itemId || !procedimento.trim()) return false;

    console.log('🔵 [DEBUG] Iniciando adição de procedimento...');
    console.log('🔵 [DEBUG] Item ID:', itemId);
    console.log('🔵 [DEBUG] Item Tipo:', itemTipo);
    console.log('🔵 [DEBUG] Procedimento:', procedimento.trim());

    setAdicionando(true);
    setError('');

    try {
      // Obter dados do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      console.log('🔵 [DEBUG] Usuário autenticado:', user.id);

      // Obter profile do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profile não encontrado');

      console.log('🔵 [DEBUG] Profile encontrado:', profile);

      let error;
      
      if (itemTipo === 'acesso') {
        console.log('🔵 [DEBUG] Usando função de acesso...');
        // Usar a função específica para acessos
        const result = await supabase.rpc('adicionar_historico_acesso', {
          p_acesso_id: itemId,
          p_procedimento: procedimento.trim(),
          p_usuario_id: user.id,
          p_usuario_nome: profile.full_name,
          p_usuario_email: profile.email
        });
        console.log('🔵 [DEBUG] Resposta função acesso:', { error: result.error, data: result.data });
        error = result.error;
      } else {
        console.log('🔵 [DEBUG] Usando função de procedimento...');
        // Usar a função existente para solicitacoes/demandas
        const result = await supabase.rpc('adicionar_historico_procedimento', {
          p_item_id: itemId,
          p_item_tipo: itemTipo,
          p_procedimento: procedimento.trim(),
          p_usuario_id: user.id,
          p_usuario_nome: profile.full_name,
          p_usuario_email: profile.email
        });
        console.log('🔵 [DEBUG] Resposta função procedimento:', { error: result.error, data: result.data });
        error = result.error;
      }

      if (error) {
        console.error('🔵 [DEBUG] Erro na RPC:', error);
        throw error;
      }

      console.log('🔵 [DEBUG] Procedimento adicionado com sucesso!');

      // Recarregar histórico para incluir o novo procedimento
      await carregarHistorico();
      
      return true;
    } catch (err) {
      console.error('🔵 [DEBUG] Erro completo:', err);
      Logger.error('Erro ao adicionar procedimento', { err }, 'useHistoricoProcedimentos', false);
      setError(`Não foi possível adicionar o procedimento: ${(err as any)?.message || 'Erro desconhecido'}`);
      return false;
    } finally {
      setAdicionando(false);
    }
  };

  // Verificar se usuário pode adicionar procedimentos
  const podeAdicionarProcedimento = async (): Promise<boolean> => {
    if (!itemId) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Verificar se é admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'admin') return true;

      // Verificar se é responsável pelo item
      const tableName = itemTipo === 'solicitacao' ? 'solicitacoes' : 'demandas';
      const { data: item } = await supabase
        .from(tableName)
        .select('user_id, responsavel')
        .eq('id', itemId)
        .single();

      if (!item) return false;

      // Pode adicionar se é criador ou responsável
      return item.user_id === user.id || item.responsavel === user.id;
    } catch (err) {
      Logger.error('Erro ao verificar permissões', { err }, 'useHistoricoProcedimentos', false);
      return false;
    }
  };

  // Formatar data para exibição
  const formatarData = (dataString: string): string => {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obter último procedimento (para dashboard)
  const getUltimoProcedimento = (): Procedimento | null => {
    return historico.length > 0 ? historico[0] : null;
  };

  // Carregar histórico quando itemId ou itemTipo mudar
  useEffect(() => {
    carregarHistorico();
  }, [itemId, itemTipo]);

  return {
    historico,
    loading,
    error,
    adicionando,
    carregarHistorico,
    adicionarProcedimento,
    podeAdicionarProcedimento,
    formatarData,
    getUltimoProcedimento
  };
}
