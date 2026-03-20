import { useState } from 'react';

export interface ProcedimentoTemporario {
  procedimento: string;
  usuario_id?: string;
  usuario_nome?: string;
  usuario_email?: string;
}

export function useHistoricoTemporario() {
  const [procedimentosTemporarios, setProcedimentosTemporarios] = useState<ProcedimentoTemporario[]>([]);
  const [adicionando, setAdicionando] = useState(false);

  // Adicionar procedimento temporário
  const adicionarProcedimentoTemporario = async (procedimento: string, usuarioInfo?: { id: string; nome: string; email: string }): Promise<boolean> => {
    if (!procedimento.trim()) return false;

    setAdicionando(true);
    
    try {
      const novoProcedimento: ProcedimentoTemporario = {
        procedimento: procedimento.trim(),
        ...(usuarioInfo && {
          usuario_id: usuarioInfo.id,
          usuario_nome: usuarioInfo.nome,
          usuario_email: usuarioInfo.email
        })
      };

      setProcedimentosTemporarios(prev => [novoProcedimento, ...prev]);
      return true;
    } catch (err) {
      console.error('Erro ao adicionar procedimento temporário:', err);
      return false;
    } finally {
      setAdicionando(false);
    }
  };

  // Limpar procedimentos temporários
  const limparProcedimentosTemporarios = () => {
    setProcedimentosTemporarios([]);
  };

  // Obter procedimentos para salvar
  const getProcedimentosParaSalvar = (): string[] => {
    return procedimentosTemporarios.map(p => p.procedimento);
  };

  // Formatar data para exibição
  const formatarData = (): string => {
    return new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return {
    procedimentosTemporarios,
    adicionando,
    adicionarProcedimentoTemporario,
    limparProcedimentosTemporarios,
    getProcedimentosParaSalvar,
    formatarData
  };
}
