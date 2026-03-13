/*
  # Migration: Migrate Observacoes to Historico Procedimentos
  
  This migration:
  1. Migrates existing observacoes to historico_procedimentos as first records
  2. Preserves all existing data with proper user attribution
  3. Adds prefix "Observação original:" to distinguish migrated records
  4. Handles both solicitacoes and demandas tables
*/

-- Migrar observações existentes de solicitacoes para histórico
INSERT INTO historico_procedimentos (
  item_id, 
  item_tipo, 
  procedimento, 
  usuario_id, 
  usuario_nome, 
  usuario_email, 
  created_at,
  updated_at
)
SELECT 
  s.id, 
  'solicitacao', 
  CASE 
    WHEN s.observacoes IS NOT NULL AND TRIM(s.observacoes) != '' THEN 
      'Observação original: ' || TRIM(s.observacoes)
    ELSE 
      'Observação original: Sem observações anteriores'
  END as procedimento,
  COALESCE(s.user_id, '00000000-0000-0000-0000-000000000000') as usuario_id,
  COALESCE(
    p_criador.full_name, 
    p_responsavel.full_name, 
    'Sistema'
  ) as usuario_nome,
  COALESCE(
    p_criador.email, 
    p_responsavel.email, 
    'sistema@exemplo.com'
  ) as usuario_email,
  COALESCE(s.created_at, NOW()) as created_at,
  NOW() as updated_at
FROM solicitacoes s
LEFT JOIN profiles p_criador ON p_criador.id = s.user_id
LEFT JOIN profiles p_responsavel ON p_responsavel.id = NULLIF(TRIM(s.responsavel), '')::text::uuid
WHERE s.id IS NOT NULL;

-- Migrar observações existentes de demandas para histórico
INSERT INTO historico_procedimentos (
  item_id, 
  item_tipo, 
  procedimento, 
  usuario_id, 
  usuario_nome, 
  usuario_email, 
  created_at,
  updated_at
)
SELECT 
  d.id, 
  'demanda', 
  CASE 
    WHEN d.observacoes IS NOT NULL AND TRIM(d.observacoes) != '' THEN 
      'Observação original: ' || TRIM(d.observacoes)
    ELSE 
      'Observação original: Sem observações anteriores'
  END as procedimento,
  COALESCE(d.user_id, '00000000-0000-0000-0000-000000000000') as usuario_id,
  COALESCE(
    p_criador.full_name, 
    p_responsavel.full_name, 
    'Sistema'
  ) as usuario_nome,
  COALESCE(
    p_criador.email, 
    p_responsavel.email, 
    'sistema@exemplo.com'
  ) as usuario_email,
  COALESCE(d.created_at, NOW()) as created_at,
  NOW() as updated_at
FROM demandas d
LEFT JOIN profiles p_criador ON p_criador.id = d.user_id
LEFT JOIN profiles p_responsavel ON p_responsavel.id = NULLIF(TRIM(d.responsavel), '')::text::uuid
WHERE d.id IS NOT NULL;

-- Log para verificação
DO $$
DECLARE
  solicitacoes_migradas INTEGER;
  demandas_migradas INTEGER;
  total_migradas INTEGER;
BEGIN
  SELECT COUNT(*) INTO solicitacoes_migradas 
  FROM historico_procedimentos 
  WHERE item_tipo = 'solicitacao' 
  AND procedimento LIKE 'Observação original:%';
  
  SELECT COUNT(*) INTO demandas_migradas 
  FROM historico_procedimentos 
  WHERE item_tipo = 'demanda' 
  AND procedimento LIKE 'Observação original:%';
  
  total_migradas := solicitacoes_migradas + demandas_migradas;
  
  RAISE NOTICE '=== MIGRAÇÃO DE OBSERVAÇÕES CONCLUÍDA ===';
  RAISE NOTICE 'Solicitações migradas: %', solicitacoes_migradas;
  RAISE NOTICE 'Demandas migradas: %', demandas_migradas;
  RAISE NOTICE 'Total de registros migrados: %', total_migradas;
  RAISE NOTICE '========================================';
END $$;
