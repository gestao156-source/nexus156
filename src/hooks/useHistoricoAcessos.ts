import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Logger from '../utils/logger';

export interface ProcedimentoAcesso {
  id: string;
  procedimento: string;
  usuario_id: string;
  usuario_nome: string;
  usuario_email: string;
  created_at: string;
}

export interface UseHistoricoAcessosProps {
  acessoId: string;
}

export function useHistoricoAcessos({ acessoId }: UseHistoricoAcessosProps) {
  const [historico, setHistorico] = useState<ProcedimentoAcesso[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [adicionando, setAdicionando] = useState(false);

  // Carregar histórico do acesso
  const carregarHistorico = async () => {
    if (!acessoId) return;

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.rpc('obter_historico_acessos', {
        p_acesso_id: acessoId
      });

      if (error) throw error;

      setHistorico(data || []);
    } catch (err) {
      Logger.error('Erro ao carregar histórico de acessos', { err }, 'useHistoricoAcessos', false);
      setError('Não foi possível carregar o histórico de procedimentos.');
    } finally {
      setLoading(false);
    }
  };

  // Adicionar novo procedimento
  const adicionarProcedimento = async (procedimento: string): Promise<boolean> => {
    if (!acessoId || !procedimento.trim()) return false;

    setAdicionando(true);
    setError('');

    try {
      // Obter dados do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Obter profile do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profile não encontrado');

      const { error } = await supabase.rpc('adicionar_historico_acesso', {
        p_acesso_id: acessoId,
        p_procedimento: procedimento.trim(),
        p_usuario_id: user.id,
        p_usuario_nome: profile.full_name,
        p_usuario_email: profile.email
      });

      if (error) throw error;

      // Recarregar histórico para incluir o novo procedimento
      await carregarHistorico();
      
      return true;
    } catch (err) {
      Logger.error('Erro ao adicionar procedimento de acesso', { err }, 'useHistoricoAcessos', false);
      setError('Não foi possível adicionar o procedimento.');
      return false;
    } finally {
      setAdicionando(false);
    }
  };

  // Verificar se usuário pode adicionar procedimentos (só admin)
  const podeAdicionarProcedimento = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      return profile?.role === 'admin';
    } catch (err) {
      Logger.error('Erro ao verificar permissões de acesso', { err }, 'useHistoricoAcessos', false);
      return false;
    }
  };

  // Formatar data para exibição
  const formatarData = (dataString: string): string => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obter último procedimento
  const getUltimoProcedimento = (): ProcedimentoAcesso | null => {
    return historico.length > 0 ? historico[0] : null;
  };

  // Carregar histórico quando acessoId mudar
  useEffect(() => {
    carregarHistorico();
  }, [acessoId]);

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
