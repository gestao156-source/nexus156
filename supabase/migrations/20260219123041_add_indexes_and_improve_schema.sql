/*
  # Add Indexes and Improve Schema

  Adicionar índices nas colunas frequentemente consultadas para melhorar performance.
*/

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_solicitacoes_user_id ON solicitacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_status ON solicitacoes(status);
CREATE INDEX IF NOT EXISTS idx_demandas_user_id ON demandas(user_id);
CREATE INDEX IF NOT EXISTS idx_demandas_status ON demandas(status);