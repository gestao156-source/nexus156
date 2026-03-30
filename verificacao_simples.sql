-- SCRIPT SIMPLES E DIRETO DE VERIFICAÇÃO
-- Execute este SQL no painel do Supabase

-- =====================================================
-- 1. VERIFICAR SE TABELA EXISTE
-- =====================================================
SELECT '=== TABELA tarefas_planejamento ===' as secao;
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tarefas_planejamento') 
        THEN '✅ Tabela existe'
        ELSE '❌ Tabela não existe'
    END as status,
    COUNT(*) as total_tarefas
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'tarefas_planejamento';

-- =====================================================
-- 2. VERIFICAR ESTRUTURA DA TABELA
-- =====================================================
SELECT '=== COLUNAS DA TABELA ===' as secao;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tarefas_planejamento'
ORDER BY ordinal_position;

-- =====================================================
-- 3. VERIFICAR CONSTRAINTS
-- =====================================================
SELECT '=== CONSTRAINTS ===' as secao;
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'tarefas_planejamento'::regclass
ORDER BY conname;

-- =====================================================
-- 4. VERIFICAR RLS POLICIES
-- =====================================================
SELECT '=== RLS POLICIES ===' as secao;
SELECT 
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN '✅ Leitura'
        WHEN cmd = 'INSERT' THEN '✅ Inserção'
        WHEN cmd = 'UPDATE' THEN '✅ Atualização'
        WHEN cmd = 'DELETE' THEN '✅ Exclusão'
        ELSE '⚠️ ' || cmd
    END as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'tarefas_planejamento'
ORDER BY policyname;

-- =====================================================
-- 5. VERIFICAR DADOS EXISTENTES
-- =====================================================
SELECT '=== DADOS EXISTENTES ===' as secao;

-- Total por coluna
SELECT 
    coluna,
    COUNT(*) as quantidade,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM tarefas_planejamento), 2) as percentual
FROM tarefas_planejamento 
GROUP BY coluna 
ORDER BY quantidade DESC;

-- Verificar integridade
SELECT 
    'Integridade' as metrica,
    COUNT(*) as total,
    COUNT(CASE WHEN titulo IS NULL OR titulo = '' THEN 1 END) as titulos_vazios,
    COUNT(CASE WHEN criador_id IS NULL THEN 1 END) as criadores_nulos,
    COUNT(CASE WHEN responsavel_id IS NULL THEN 1 END) as responsaveis_nulos
FROM tarefas_planejamento;

-- =====================================================
-- 6. VERIFICAR RELACIONAMENTO COM PROFILES
-- =====================================================
SELECT '=== RELACIONAMENTO PROFILES ===' as secao;

-- Verificar se profiles existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') 
        THEN '✅ Tabela profiles existe'
        ELSE '❌ Tabela profiles não existe'
    END as status,
    COUNT(*) as total_profiles
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'profiles';

-- Verificar integridade do relacionamento
SELECT 
    'Relacionamento criador_id' as tipo,
    COUNT(*) as total_tarefas,
    COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) as validos,
    COUNT(CASE WHEN p.id IS NULL THEN 1 END) as invalidos,
    ROUND(COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2) as percentual_validos
FROM tarefas_planejamento t
LEFT JOIN profiles p ON t.criador_id = p.id

UNION ALL

SELECT 
    'Relacionamento responsavel_id' as tipo,
    COUNT(*) as total_tarefas,
    COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) as validos,
    COUNT(CASE WHEN p.id IS NULL THEN 1 END) as invalidos,
    ROUND(COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2) as percentual_validos
FROM tarefas_planejamento t
LEFT JOIN profiles p ON t.responsavel_id = p.id;

-- =====================================================
-- 7. VERIFICAR TRIGGERS
-- =====================================================
SELECT '=== TRIGGERS ===' as secao;
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    CASE 
        WHEN trigger_name LIKE '%updated_at%' THEN '✅ Trigger updated_at OK'
        ELSE '⚠️ Outro trigger'
    END as status
FROM information_schema.triggers 
WHERE event_object_table = 'tarefas_planejamento'
  AND trigger_schema = 'public'
ORDER BY trigger_name;

-- =====================================================
-- 8. TESTE SIMPLES DE FUNCIONALIDADE
-- =====================================================
SELECT '=== TESTES ===' as secao;

-- Testar inserção
DO $$
BEGIN
    INSERT INTO tarefas_planejamento (titulo, coluna, criador_id) 
    VALUES ('Teste Verificação', 'backlog', COALESCE((SELECT id FROM profiles LIMIT 1), gen_random_uuid()));
    
    IF EXISTS (SELECT 1 FROM tarefas_planejamento WHERE titulo = 'Teste Verificação') THEN
        RAISE NOTICE '✅ TESTE 1 OK: Inserção funcionando';
    ELSE
        RAISE NOTICE '❌ TESTE 1 FALHOU: Problema na inserção';
    END IF;
END $$;

-- Testar atualização
DO $$
BEGIN
    UPDATE tarefas_planejamento 
    SET descricao = 'Descrição atualizada'
    WHERE titulo = 'Teste Verificação';
    
    IF EXISTS (SELECT 1 FROM tarefas_planejamento WHERE titulo = 'Teste Verificação' AND descricao = 'Descrição atualizada') THEN
        RAISE NOTICE '✅ TESTE 2 OK: Atualização funcionando';
    ELSE
        RAISE NOTICE '❌ TESTE 2 FALHOU: Problema na atualização';
    END IF;
END $$;

-- =====================================================
-- 9. RESUMO FINAL
-- =====================================================
SELECT '=== RESUMO ===' as secao;
SELECT 
    'Verificação concluída em ' || to_char(now(), 'DD/MM/YYYY HH24:MI') as data_hora,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tarefas_planejamento')
             AND EXISTS (SELECT FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tarefas_planejamento')
             AND EXISTS (SELECT FROM information_schema.triggers WHERE event_object_table = 'tarefas_planejamento' AND trigger_schema = 'public')
        THEN '✅ Sistema parece OK para operações básicas'
        ELSE '⚠️ Verificar configuração faltante'
    END as status_geral;
