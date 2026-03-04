import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Demanda } from '../types/index';
import KanbanBoard from '../components/Kanban/KanbanBoard';

export default function Demandas() {
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDemandas();
  }, []);

  const loadDemandas = async () => {
    try {
      const { data, error } = await supabase
        .from('demandas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDemandas(data || []);
    } catch (error) {
      console.error('Error loading demandas:', error);
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
      items={demandas}
      type="demandas"
      onRefresh={loadDemandas}
    />
  );
}
