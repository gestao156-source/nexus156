/**
 * Utilitário para cálculo de dias úteis e verificação de atrasos
 * Centraliza a lógica para reutilização segura em Dashboard e KanbanCard
 */

// Função para calcular dias úteis entre duas datas
export const calcularDiasUteis = (dataInicio: Date, dataFim: Date): number => {
  let diasUteis = 0;
  const dataAtual = new Date(dataInicio);
  
  while (dataAtual <= dataFim) {
    const diaSemana = dataAtual.getDay();
    // 0 = Domingo, 6 = Sábado
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasUteis++;
    }
    dataAtual.setDate(dataAtual.getDate() + 1);
  }
  
  return diasUteis;
};

// Verifica se um item está atrasado baseado no status e data de contato
export const verificarAtraso = (status: string, dataContato: string | null): boolean => {
  // Ignorar itens finalizados ou sem data de contato
  if (status === 'finalizado' || !dataContato) {
    return false;
  }
  
  // Extrair apenas a parte da data (YYYY-MM-DD) sem timezone
  const dataContatoOnly = dataContato.split('T')[0];
  const hojeOnly = new Date().toISOString().split('T')[0];
  
  // Se for hoje, não está atrasado
  if (dataContatoOnly === hojeOnly) {
    return false;
  }
  
  // Calcular dias úteis (usando datas sem timezone)
  const dataContatoDate = new Date(dataContatoOnly + 'T00:00:00');
  const hoje = new Date(hojeOnly + 'T00:00:00');
  
  // Calcular dias úteis até ontem (excluir hoje da contagem)
  const ontem = new Date(hoje.getTime() - 86400000); // Subtrair 1 dia
  const diasUteisPassados = calcularDiasUteis(dataContatoDate, ontem);
  
  // Aplicar regras de prazo por status
  if (status === 'aguardando') {
    return diasUteisPassados >= 1; // Atrasa após 1 dia útil completo
  } else if (status === 'em_analise') {
    return diasUteisPassados >= 3; // Atrasa após 3 dias úteis completos
  }
  
  return false;
};
