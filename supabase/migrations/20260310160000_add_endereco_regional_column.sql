-- Adicionar coluna endereco_regional nas tabelas solicitacoes e demandas
-- Migration para adicionar suporte a regionalização automática

-- Adicionar coluna na tabela solicitacoes
ALTER TABLE solicitacoes 
ADD COLUMN IF NOT EXISTS endereco_regional TEXT;

-- Adicionar coluna na tabela demandas  
ALTER TABLE demandas
ADD COLUMN IF NOT EXISTS endereco_regional TEXT;

-- Criar índice para melhor performance em consultas por regional
CREATE INDEX IF NOT EXISTS idx_solicitacoes_endereco_regional ON solicitacoes(endereco_regional);
CREATE INDEX IF NOT EXISTS idx_demandas_endereco_regional ON demandas(endereco_regional);

-- Comentários sobre a coluna
COMMENT ON COLUMN solicitacoes.endereco_regional IS 'Regional administrativa baseada no bairro do endereço';
COMMENT ON COLUMN demandas.endereco_regional IS 'Regional administrativa baseada no bairro do endereço';
