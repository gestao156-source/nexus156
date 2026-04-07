import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  TarefaPlanejamentoExtendida, 
  CreateTarefaData, 
  UpdateTarefaData,
  Profile 
} from '../types';
import { useToast } from '../contexts/ToastContext';

export function usePlanejamentoData() {
  const [tarefas, setTarefas] = useState<TarefaPlanejamentoExtendida[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  // Carregar dados iniciais
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obter datas do mês atual
      const now = new Date();
      const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const fimMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      // Carregar tarefas com informações de responsável e criador (consulta temporária)
      const { data: tarefasData, error: tarefasError } = await supabase
        .from('tarefas_planejamento')
        .select(`
          *,
          profiles!responsavel_id (
            full_name
          ),
          creator:profiles!criador_id (
            full_name
          )
        `);

      if (tarefasError) {
        console.error('Erro ao carregar tarefas:', tarefasError);
        setError('Erro ao carregar tarefas');
        return;
      }

      // Formatar dados e filtrar tarefas concluídas do mês anterior
      const tarefasFormatadas = (tarefasData || [])
        .filter(tarefa => {
          // Se a tarefa está concluída, só mostrar se foi concluída este mês
          if (tarefa.coluna === 'concluido') {
            const dataConclusao = tarefa.data_conclusao ? new Date(tarefa.data_conclusao) : null;
            if (!dataConclusao) return true; // Se não tem data de conclusão, mostrar mesmo assim

            // Comparar se está no intervalo do mês atual
            const dataStr = dataConclusao.toISOString().split('T')[0];
            return dataStr >= inicioMes && dataStr <= fimMes;
          }
          // Tarefas não-concluídas sempre mostrar
          return true;
        })
        .map(tarefa => ({
          ...tarefa,
          responsavel_nome: tarefa.profiles?.full_name,
          criador_nome: tarefa.creator?.full_name
        }));

      // Carregar profiles para seleção de responsáveis
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, created_at')
        .order('full_name');

      if (profilesError) {
        console.error('Erro ao carregar profiles:', profilesError);
        setError('Erro ao carregar usuários');
        return;
      }

      setTarefas(tarefasFormatadas);
      setProfiles(profilesData || []);
    } catch (err) {
      console.error('Erro inesperado:', err);
      setError('Erro inesperado ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Criar nova tarefa
  const createTarefa = async (data: CreateTarefaData) => {
    try {
      // Obter usuário atual
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      console.log('Auth check:', { user, authError });
      
      if (authError) {
        console.error('Erro de autenticação:', authError);
        throw new Error(`Erro de autenticação: ${authError.message}`);
      }
      
      if (!user) {
        console.error('Usuário não encontrado');
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }

      // Obter próxima ordem para a coluna
      const { data: maxOrdem } = await supabase
        .from('tarefas_planejamento')
        .select('ordem')
        .eq('coluna', data.coluna || 'backlog')
        .order('ordem', { ascending: false })
        .limit(1)
        .maybeSingle(); // Usar maybeSingle para evitar erro quando não há registros

      const novaOrdem = maxOrdem?.ordem ? maxOrdem.ordem + 1 : 1;

      // Preparar dados apenas com campos válidos do CreateTarefaData
      const novaTarefa: any = {
        titulo: data.titulo,
        descricao: data.descricao || '',
        coluna: data.coluna || 'backlog',
        etiqueta: data.etiqueta || '',
        responsavel_id: data.responsavel_id || null, // Usar null em vez de string vazia
        criador_id: user.id,
        prioridade: data.prioridade || 'media',
        ordem: novaOrdem,
        tags: data.tags || []
        // Removido created_at para usar default do banco
      };

      // Adicionar campos de data apenas se tiverem valores
      if (data.data_inicio) novaTarefa.data_inicio = data.data_inicio;
      if (data.data_limite) novaTarefa.data_limite = data.data_limite;

      const { error } = await supabase
        .from('tarefas_planejamento')
        .insert(novaTarefa);

      if (error) {
        console.error('Erro ao criar tarefa:', error);
        
        // Tratar diferentes tipos de erro
        let errorMessage = 'Não foi possível criar a tarefa';
        
        if (error.code === 'PGRST116') {
          errorMessage = 'Erro de permissão: você não tem permissão para criar tarefas';
        } else if (error.code === '23514') {
          errorMessage = 'Dados inválidos: verifique os campos obrigatórios';
        } else if (error.code === '23505') {
          errorMessage = 'Tarefa duplicada: já existe uma tarefa com esses dados';
        } else if (error.message?.includes('406')) {
          errorMessage = 'Formato de dados não aceito pelo servidor';
        } else if (error.message?.includes('400')) {
          errorMessage = 'Requisição inválida: verifique os dados enviados';
        }
        
        throw new Error(errorMessage);
      }

      // Recarregar dados para obter informações completas
      await loadData();
      showSuccess('Tarefa Criada', `"${data.titulo}" foi criada com sucesso!`);
      return novaTarefa;
    } catch (err) {
      console.error('Erro ao criar tarefa:', err);
      showError('Erro ao Criar', 'Não foi possível criar a tarefa. Tente novamente.');
      throw err;
    }
  };

  // Atualizar tarefa existente
  const updateTarefa = async (data: UpdateTarefaData) => {
    try {
      // Verificar se é ação de exclusão
      if (data.action === 'delete') {
        await deleteTarefa(data.id);
        return;
      }

      // Atualização normal - limpar campos vazios
      const updateData: any = {
        ...data,
        updated_at: new Date().toISOString()
      };

      // Se movendo para "concluido", adicionar data de conclusão
      if (data.coluna === 'concluido' && !data.data_conclusao) {
        updateData.data_conclusao = new Date().toISOString().split('T')[0];
      }

      // Remover campos vazios para evitar erro de data
      if (!updateData.data_inicio) delete updateData.data_inicio;
      if (!updateData.data_limite) delete updateData.data_limite;
      if (!updateData.data_conclusao) delete updateData.data_conclusao;
// Tratar campos UUID vazios
      if (!updateData.responsavel_id || updateData.responsavel_id === '') {
        delete updateData.responsavel_id;
      }
      // Remover campo action se existir
      delete updateData.action;

      const { error } = await supabase
        .from('tarefas_planejamento')
        .update(updateData)
        .eq('id', data.id);

      if (error) {
        console.error('Erro ao atualizar tarefa:', error);
        showError('Erro ao Atualizar', 'Não foi possível atualizar a tarefa.');
        throw error;
      }

      // Recarregar dados
      await loadData();
      showSuccess('Tarefa Atualizada', 'Tarefa atualizada com sucesso!');
    } catch (err) {
      console.error('Erro ao atualizar tarefa:', err);
      showError('Erro ao Atualizar', 'Não foi possível atualizar a tarefa. Tente novamente.');
      throw err;
    }
  };

  // Excluir tarefa
  const deleteTarefa = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tarefas_planejamento')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir tarefa:', error);
        showError('Erro ao Excluir', 'Não foi possível excluir a tarefa.');
        throw error;
      }

      // Recarregar dados
      await loadData();
      showSuccess('Tarefa Excluída', 'Tarefa excluída com sucesso!');
    } catch (err) {
      console.error('Erro ao excluir tarefa:', err);
      showError('Erro ao Excluir', 'Não foi possível excluir a tarefa. Tente novamente.');
      throw err;
    }
  };

  // Mover tarefa entre colunas (com reordenação)
  const moveTarefa = async (tarefaId: string, novaColuna: string, novaOrdem?: number) => {
    try {
      const { error } = await supabase
        .from('tarefas_planejamento')
        .update({
          coluna: novaColuna,
          ordem: novaOrdem || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', tarefaId);

      if (error) {
        console.error('Erro ao mover tarefa:', error);
        showError('Erro ao Mover', 'Não foi possível mover a tarefa.');
        throw error;
      }

      // Recarregar dados
      await loadData();
      showSuccess('Tarefa Movida', 'Tarefa movida com sucesso!');
    } catch (err) {
      console.error('Erro ao mover tarefa:', err);
      showError('Erro ao Mover', 'Não foi possível mover a tarefa. Tente novamente.');
      throw err;
    }
  };

  // Carregar dados na montagem do componente
  useEffect(() => {
    loadData();
  }, []);

  // Inscrever para atualizações em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('tarefas_planejamento_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tarefas_planejamento'
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    tarefas,
    profiles,
    loading,
    error,
    refetch: loadData,
    createTarefa,
    updateTarefa,
    deleteTarefa,
    moveTarefa
  };
}
