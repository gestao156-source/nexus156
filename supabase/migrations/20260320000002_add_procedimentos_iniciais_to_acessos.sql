/*
  # Add procedimentos_iniciais column to acessos table
  
  Adiciona coluna para armazenar procedimentos iniciais temporariamente
  durante a criação de um novo acesso, antes de migrar para o histórico
*/

-- Adicionar coluna procedimentos_iniciais como array de textos
ALTER TABLE acessos 
ADD COLUMN IF NOT EXISTS procedimentos_iniciais text[];

-- Adicionar comentário
COMMENT ON COLUMN acessos.procedimentos_iniciais IS 'Procedimentos iniciais temporários (array de textos) - será migrado para historico_acessos após criação';

-- Criar índice para performance (opcional)
CREATE INDEX IF NOT EXISTS idx_acessos_procedimentos_iniciais ON acessos USING GIN (procedimentos_iniciais);
