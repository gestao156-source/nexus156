/*
  # Remove Campo Observacoes das Tabelas Principais
  
  Esta migration remove o campo observacoes das tabelas solicitacoes e demandas
  após a migração para historico_procedimentos ter sido concluída.
  
  IMPORTANTE: Esta migration deve ser executada APENAS após a migration
  20260313120000_migrar_observacoes_para_historico.sql ter sido concluída
  com sucesso.
*/

-- Backup de segurança (opcional - comentado para evitar dados duplicados)
/*
CREATE TABLE solicitacoes_observacoes_backup AS 
SELECT id, observacoes, created_at, updated_at 
FROM solicitacoes 
WHERE observacoes IS NOT NULL AND TRIM(observacoes) != '';

CREATE TABLE demandas_observacoes_backup AS 
SELECT id, observacoes, created_at, updated_at 
FROM demandas 
WHERE observacoes IS NOT NULL AND TRIM(observacoes) != '';
*/

-- Remover campo observacoes da tabela solicitacoes
ALTER TABLE solicitacoes DROP COLUMN IF EXISTS observacoes;

-- Remover campo observacoes da tabela demandas  
ALTER TABLE demandas DROP COLUMN IF EXISTS observacoes;

-- Verificação
DO $$
DECLARE
  solicitacoes_count INTEGER;
  demandas_count INTEGER;
BEGIN
  -- Verificar se as tabelas ainda existem e não têm o campo observacoes
  BEGIN
    SELECT COUNT(*) INTO solicitacoes_count FROM information_schema.columns 
    WHERE table_name = 'solicitacoes' AND column_name = 'observacoes';
    
    SELECT COUNT(*) INTO demandas_count FROM information_schema.columns 
    WHERE table_name = 'demandas' AND column_name = 'observacoes';
    
    IF solicitacoes_count = 0 AND demandas_count = 0 THEN
      RAISE NOTICE '✅ Campo observacoes removido com sucesso de ambas as tabelas';
    ELSE
      RAISE NOTICE '⚠️ Aviso: Campo observacoes ainda existe em alguma tabela';
      RAISE NOTICE 'Solicitacoes: % colunas encontradas', solicitacoes_count;
      RAISE NOTICE 'Demandas: % colunas encontradas', demandas_count;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Erro ao verificar remoção do campo observacoes: %', SQLERRM;
  END;
END $$;

-- Atualizar views se existirem (preparação para futuras implementações)
/*
DROP VIEW IF EXISTS solicitacoes_com_historico;
DROP VIEW IF EXISTS demandas_com_historico;
*/
