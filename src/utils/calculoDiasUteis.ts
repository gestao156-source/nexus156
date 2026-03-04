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
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0); // Zerar horas para comparação correta
  
  const dataContatoDate = new Date(dataContato);
  dataContatoDate.setHours(0, 0, 0, 0); // Zerar horas para comparação correta
  
  // Calcular dias úteis desde a data de contato
  const diasUteisPassados = calcularDiasUteis(dataContatoDate, hoje);
  
  // Aplicar regras de prazo por status
  if (status === 'aguardando') {
    return diasUteisPassados > 1; // 1 dia útil de prazo
  } else if (status === 'em_analise') {
    return diasUteisPassados > 3; // 3 dias úteis de prazo
  }
  
  return false;
};
