import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { KanbanItem } from '../types/index';
import ErrorService from '../services/errorService';
import KanbanBoard from '../components/Kanban/KanbanBoard';
import { FiltroResponsavel } from '../components/Filtros';

export default function Solicitacoes() {
  const [solicitacoes, setSolicitacoes] = useState<KanbanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [responsaveisFiltro, setResponsaveisFiltro] = useState<string[]>([]);

  useEffect(() => {
    loadSolicitacoes();
  }, [responsaveisFiltro]);

  const loadSolicitacoes = async () => {
    try {
      let query = supabase
        .from('solicitacoes')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtro por responsáveis se houver seleção
      if (responsaveisFiltro.length > 0) {
        query = query.in('responsavel', responsaveisFiltro);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Filtrar itens finalizados para mostrar apenas do mês atual
      const dataAtual = new Date();
      const primeiroDiaMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth(), 1);
      const ultimoDiaMes = new Date(dataAtual.getFullYear(), dataAtual.getMonth() + 1, 0);
      
      const solicitacoesFiltradas = (data || []).map(item => {
        // Se for finalizado, verificar se está no mês atual
        if (item.status === 'finalizado') {
          const dataFinalizado = new Date(item.updated_at || item.created_at);
          if (dataFinalizado < primeiroDiaMes || dataFinalizado > ultimoDiaMes) {
            return null; // Não mostrar se não for do mês atual
          }
        }
        return item;
      }).filter(Boolean); // Remover itens nulos
      
      // Adicionar tipo 'solicitacao' aos dados
      const solicitacoesComTipo = solicitacoesFiltradas.map(item => ({
        ...item,
        tipo: 'solicitacao' as const
      }));
      setSolicitacoes(solicitacoesComTipo);
    } catch (error) {
      ErrorService.handleError(error, { component: 'Solicitacoes', action: 'loadSolicitacoes' });
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
        items={solicitacoes}
        type="solicitacoes"
        onRefresh={loadSolicitacoes}
      />
    </div>
  );
}

