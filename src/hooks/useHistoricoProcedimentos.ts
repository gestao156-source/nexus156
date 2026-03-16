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
  itemTipo: 'solicitacao' | 'demanda';
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
      const { data, error } = await supabase.rpc('obter_historico_procedimentos', {
        p_item_id: itemId,
        p_item_tipo: itemTipo
      });

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

    setAdicionando(true);
    setError('');

    try {
      const { error } = await supabase.rpc('adicionar_procedimento', {
        p_item_id: itemId,
        p_item_tipo: itemTipo,
        p_procedimento: procedimento.trim()
      });

      if (error) throw error;

      // Recarregar histórico para incluir o novo procedimento
      await carregarHistorico();
      
      return true;
    } catch (err) {
      Logger.error('Erro ao adicionar procedimento', { err }, 'useHistoricoProcedimentos', false);
      setError('Não foi possível adicionar o procedimento.');
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
