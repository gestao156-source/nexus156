import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Solicitacao } from '../types';
import KanbanBoard from '../components/Kanban/KanbanBoard';

export default function Solicitacoes() {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSolicitacoes();
  }, []);

  const loadSolicitacoes = async () => {
    try {
      const { data, error } = await supabase
        .from('solicitacoes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSolicitacoes(data || []);
    } catch (error) {
      console.error('Error loading solicitacoes:', error);
    } finally {
      setLoading(false);
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
    <KanbanBoard
      items={solicitacoes}
      type="solicitacoes"
      onRefresh={loadSolicitacoes}
    />
  );
}
