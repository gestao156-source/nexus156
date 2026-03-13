-- Script de debug para identificar problemas no histórico
-- Execute este script se ainda houver erros após a implementação

-- 1. Verificar se usuário autenticado pode acessar a tabela
DO $$
DECLARE
  test_count INTEGER;
BEGIN
  -- Testar SELECT direto (sem RLS)
  SELECT COUNT(*) INTO test_count FROM historico_procedimentos;
  RAISE NOTICE '📊 Total de procedimentos no banco: %', test_count;
  
  -- Testar SELECT com RLS (simulando usuário autenticado)
  -- Isso pode falhar se não houver contexto de autenticação
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Erro ao acessar tabela: %', SQLERRM;
END $$;

-- 2. Verificar se as RPC functions existem e podem ser chamadas
DO $$
DECLARE
  function_exists INTEGER;
BEGIN
  SELECT COUNT(*) INTO function_exists
  FROM pg_proc 
  WHERE proname = 'obter_historico_procedimentos';
  
  IF function_exists > 0 THEN
    RAISE NOTICE '✅ RPC function obter_historico_procedimentos existe';
    
    -- Tentar testar com um ID válido (se houver dados)
    IF EXISTS (SELECT 1 FROM historico_procedimentos LIMIT 1) THEN
      RAISE NOTICE '🧪 Testando RPC function...';
      -- Note: Isso pode falhar no SQL Editor sem contexto de autenticação
    ELSE
      RAISE NOTICE 'ℹ️ Nenhum dado para testar RPC function';
    END IF;
  ELSE
    RAISE NOTICE '❌ RPC function obter_historico_procedimentos NÃO existe';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Erro ao verificar RPC function: %', SQLERRM;
END $$;

-- 3. Verificar se o problema está nas permissões RLS
DO $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class 
  WHERE relname = 'historico_procedimentos';
  
  IF rls_enabled THEN
    RAISE NOTICE '🔐 RLS está habilitado na tabela';
    
    -- Verificar se há policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'historico_procedimentos') THEN
      RAISE NOTICE '✅ Policies RLS encontradas';
    ELSE
      RAISE NOTICE '❌ Nenhuma policy RLS encontrada - isto pode causar o erro!';
    END IF;
  ELSE
    RAISE NOTICE '⚠️ RLS NÃO está habilitado na tabela';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Erro ao verificar RLS: %', SQLERRM;
END $$;

-- 4. Verificar estrutura completa da tabela
SELECT 
  'Estrutura da tabela historico_procedimentos:' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'historico_procedimentos'
ORDER BY ordinal_position;

-- 5. Verificar se há problemas com as constraints
SELECT 
  'Constraints da tabela:' as info,
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'historico_procedimentos'::regclass;

-- 6. Teste simples de inserção (para verificar se tudo funciona)
DO $$
DECLARE
  test_id uuid;
BEGIN
  -- Tentar inserir um registro de teste
  -- Note: Isso pode falhar sem contexto de autenticação adequado
  INSERT INTO historico_procedimentos (
    item_id, item_tipo, procedimento, usuario_id, usuario_nome, usuario_email
  ) VALUES (
    gen_random_uuid(),
    'solicitacao',
    'Teste de inserção manual',
    '00000000-0000-0000-0000-000000000000',
    'Teste User',
    'teste@exemplo.com'
  ) RETURNING id INTO test_id;
  
  RAISE NOTICE '✅ Inserção de teste funcionou, ID: %', test_id;
  
  -- Remover o teste
  DELETE FROM historico_procedimentos WHERE id = test_id;
  RAISE NOTICE '🧹 Registro de teste removido';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Erro na inserção de teste: %', SQLERRM;
  RAISE NOTICE '🔍 Este erro pode ser devido à falta de contexto de autenticação no SQL Editor';
END $$;

-- 7. Diagnóstico final
DO $$
DECLARE
  table_ok BOOLEAN := FALSE;
  rls_ok BOOLEAN := FALSE;
  functions_ok BOOLEAN := FALSE;
BEGIN
  -- Verificar tabela
  SELECT COUNT(*) > 0 INTO table_ok
  FROM information_schema.tables 
  WHERE table_name = 'historico_procedimentos';
  
  -- Verificar RLS
  SELECT COUNT(*) > 0 INTO rls_ok
  FROM pg_policies 
  WHERE tablename = 'historico_procedimentos';
  
  -- Verificar functions
  SELECT COUNT(*) = 2 INTO functions_ok
  FROM pg_proc 
  WHERE proname IN ('adicionar_procedimento', 'obter_historico_procedimentos');
  
  RAISE NOTICE '';
  RAISE NOTICE '=== DIAGNÓSTICO FINAL ===';
  RAISE NOTICE '📊 Tabela criada: %', CASE WHEN table_ok THEN '✅' ELSE '❌' END;
  RAISE NOTICE '🔐 RLS configurado: %', CASE WHEN rls_ok THEN '✅' ELSE '❌' END;
  RAISE NOTICE '🔧 Functions criadas: %', CASE WHEN functions_ok THEN '✅' ELSE '❌' END;
  
  IF table_ok AND rls_ok AND functions_ok THEN
    RAISE NOTICE '🎉 Sistema implementado corretamente!';
    RAISE NOTICE '💡 Se ainda houver erros, pode ser problema de autenticação no frontend';
  ELSE
    RAISE NOTICE '⚠️ Sistema não está completamente implementado';
    RAISE NOTICE '🔧 Execute novamente o script de implementação';
  END IF;
  RAISE NOTICE '========================';
END $$;
