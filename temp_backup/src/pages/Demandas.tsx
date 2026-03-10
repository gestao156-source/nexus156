import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Demanda } from '../types/index';
import KanbanBoard from '../components/Kanban/KanbanBoard';
import { FiltroResponsavel } from '../components/Filtros';

export default function Demandas() {
  const [demandas, setDemandas] = useState<Demanda[]>([]);
  const [loading, setLoading] = useState(true);
  const [responsaveisFiltro, setResponsaveisFiltro] = useState<string[]>([]);

  useEffect(() => {
    loadDemandas();
  }, [responsaveisFiltro]);

  const loadDemandas = async () => {
    try {
      let query = supabase
        .from('demandas')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtro por responsáveis se houver seleção
      if (responsaveisFiltro.length > 0) {
        query = query.in('responsavel', responsaveisFiltro);
      }

      const { data, error } = await query;

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
    <div className="space-y-6">
      {/* Filtro por Responsável */}
      <FiltroResponsavel
        responsaveisSelecionados={responsaveisFiltro}
        onResponsaveisChange={setResponsaveisFiltro}
        className="w-full"
      />

      {/* Kanban Board */}
      <KanbanBoard
        items={demandas}
        type="demandas"
        onRefresh={loadDemandas}
      />
    </div>
  );
}
