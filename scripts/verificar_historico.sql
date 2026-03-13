-- Script de verificação do sistema de histórico de procedimentos
-- Execute este script no Supabase SQL Editor para verificar se tudo foi criado corretamente

-- 1. Verificar se a tabela existe
DO $$
DECLARE
  table_exists INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_exists
  FROM information_schema.tables 
  WHERE table_name = 'historico_procedimentos';
  
  IF table_exists > 0 THEN
    RAISE NOTICE '✅ Tabela historico_procedimentos existe';
  ELSE
    RAISE NOTICE '❌ Tabela historico_procedimentos NÃO existe';
  END IF;
END $$;

-- 2. Verificar estrutura da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'historico_procedimentos'
ORDER BY ordinal_position;

-- 3. Verificar índices
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'historico_procedimentos';

-- 4. Verificar RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'historico_procedimentos';

-- 5. Verificar RPC functions
SELECT 
  proname,
  prokind,
  prosrc
FROM pg_proc 
WHERE proname IN ('adicionar_procedimento', 'obter_historico_procedimentos')
ORDER BY proname;

-- 6. Verificar dados migrados (se existirem)
SELECT 
  COUNT(*) as total_procedimentos,
  COUNT(CASE WHEN procedimento LIKE 'Observação original:%' THEN 1 END) as migrados,
  COUNT(CASE WHEN procedimento NOT LIKE 'Observação original:%' THEN 1 END) as novos
FROM historico_procedimentos;

-- 7. Verificar exemplos de dados
SELECT 
  item_tipo,
  usuario_nome,
  LEFT(procedimento, 50) as preview_procedimento,
  created_at
FROM historico_procedimentos 
ORDER BY created_at DESC 
LIMIT 5;

-- 8. Testar RPC function (se houver dados)
DO $$
DECLARE
  test_result RECORD;
BEGIN
  -- Testar obter_historico_procedimentos se houver algum procedimento
  IF EXISTS (SELECT 1 FROM historico_procedimentos LIMIT 1) THEN
    SELECT * INTO test_result 
    FROM obter_historico_procedimentos(
      (SELECT id FROM historico_procedimentos LIMIT 1),
      (SELECT item_tipo FROM historico_procedimentos LIMIT 1)
    ) LIMIT 1;
    
    RAISE NOTICE '✅ RPC function obter_historico_procedimentos funcionando';
  ELSE
    RAISE NOTICE 'ℹ️ Nenhum procedimento encontrado para testar RPC function';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Erro ao testar RPC function: %', SQLERRM;
END $$;

-- 9. Verificar se campo observacoes foi removido
DO $$
DECLARE
  obs_solicitacoes INTEGER;
  obs_demandas INTEGER;
BEGIN
  SELECT COUNT(*) INTO obs_solicitacoes
  FROM information_schema.columns 
  WHERE table_name = 'solicitacoes' AND column_name = 'observacoes';
  
  SELECT COUNT(*) INTO obs_demandas
  FROM information_schema.columns 
  WHERE table_name = 'demandas' AND column_name = 'observacoes';
  
  IF obs_solicitacoes = 0 AND obs_demandas = 0 THEN
    RAISE NOTICE '✅ Campo observacoes removido de ambas as tabelas';
  ELSE
    RAISE NOTICE '⚠️ Campo observacoes ainda existe:';
    IF obs_solicitacoes > 0 THEN
      RAISE NOTICE '   - solicitacoes: % coluna(s)', obs_solicitacoes;
    END IF;
    IF obs_demandas > 0 THEN
      RAISE NOTICE '   - demandas: % coluna(s)', obs_demandas;
    END IF;
  END IF;
END $$;

-- 10. Resumo final
DO $$
DECLARE
  total_procedures INTEGER;
  total_policies INTEGER;
  total_indexes INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_procedures 
  FROM pg_proc 
  WHERE proname IN ('adicionar_procedimento', 'obter_historico_procedimentos');
  
  SELECT COUNT(*) INTO total_policies 
  FROM pg_policies 
  WHERE tablename = 'historico_procedimentos';
  
  SELECT COUNT(*) INTO total_indexes 
  FROM pg_indexes 
  WHERE tablename = 'historico_procedimentos';
  
  RAISE NOTICE '';
  RAISE NOTICE '=== RESUMO DA VERIFICAÇÃO ===';
  RAISE NOTICE '📊 RPC functions: %/2 criadas', total_procedures;
  RAISE NOTICE '🔐 RLS policies: % criadas', total_policies;
  RAISE NOTICE '⚡ Índices: % criados', total_indexes;
  RAISE NOTICE '🔗 Conecte-se ao aplicativo para testar funcionalidade';
  RAISE NOTICE '============================';
END $$;
