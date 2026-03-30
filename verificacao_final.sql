-- SCRIPT SIMPLES DE VERIFICAÇÃO FRONT-END vs BACK-END
-- SEM UNIONS - SEM COMPLICAÇÕES
-- Execute este SQL no painel do Supabase

-- =====================================================
-- 1. TABELA EXISTE?
-- =====================================================
SELECT '=== TABELA EXISTE? ===' as secao;

SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tarefas_planejamento') 
        THEN '✅ Sim, tabela existe'
        ELSE '❌ Não, tabela não existe'
    END as resposta;

-- =====================================================
-- 2. COLUNAS DA TABELA
-- =====================================================
SELECT '=== COLUNAS DA TABELA ===' as secao;

SELECT 
    column_name,
    data_type,
    is_nullable,
    COALESCE(column_default::text, '') as valor_padrao
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tarefas_planejamento'
ORDER BY ordinal_position;

-- =====================================================
-- 3. CONSTRAINTS (VERIFICAR SE TEM CHECK PROBLEMÁTICAS)
-- =====================================================
SELECT '=== CONSTRAINTS DA TABELA ===' as secao;

SELECT 
    conname as nome_constraint,
    contype as tipo,
    CASE 
        WHEN contype = 'c' THEN '⚠️ CHECK - pode bloquear operações'
        WHEN contype = 'p' THEN '✅ PRIMARY KEY'
        WHEN contype = 'f' THEN '🔗 FOREIGN KEY'
        WHEN contype = 'u' THEN '🔒 UNIQUE'
        ELSE '❓ Outro'
    END as status,
    pg_get_constraintdef(oid) as definicao
FROM pg_constraint 
WHERE conrelid = 'tarefas_planejamento'::regclass
ORDER BY conname;

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================
SELECT '=== RLS POLICIES (PERMISSÕES) ===' as secao;

SELECT 
    policyname,
    cmd as operacao,
    CASE 
        WHEN cmd = 'SELECT' THEN '✅ Leitura'
        WHEN cmd = 'INSERT' THEN '✅ Inserção'
        WHEN cmd = 'UPDATE' THEN '✅ Atualização'
        WHEN cmd = 'DELETE' THEN '✅ Exclusão'
        ELSE '⚠️ Outro'
    END as permissao
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'tarefas_planejamento'
ORDER BY policyname;

-- =====================================================
-- 5. DADOS EXISTENTES
-- =====================================================
SELECT '=== DADOS EXISTENTES ===' as secao;

SELECT 
    coluna,
    COUNT(*) as quantidade
FROM tarefas_planejamento 
GROUP BY coluna 
ORDER BY quantidade DESC;

-- =====================================================
-- 6. TABELA PROFILES EXISTE?
-- =====================================================
SELECT '=== TABELA PROFILES ===' as secao;

SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') 
        THEN '✅ Sim, tabela profiles existe'
        ELSE '❌ Não, tabela profiles não existe'
    END as resposta,
    COUNT(*) as total_profiles
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'profiles';

-- =====================================================
-- 7. INTEGRIDADE DOS DADOS
-- =====================================================
SELECT '=== INTEGRIDADE DOS DADOS ===' as secao;

SELECT 
    COUNT(*) as total_tarefas,
    COUNT(CASE WHEN titulo IS NULL OR titulo = '' THEN 1 END) as titulos_vazios,
    COUNT(CASE WHEN criador_id IS NULL THEN 1 END) as criadores_nulos,
    COUNT(CASE WHEN responsavel_id IS NULL THEN 1 END) as responsaveis_nulos
FROM tarefas_planejamento;

-- =====================================================
-- 8. TRIGGERS CONFIGURADOS?
-- =====================================================
SELECT '=== TRIGGERS ===' as secao;

SELECT 
    trigger_name,
    event_manipulation as evento,
    CASE 
        WHEN trigger_name LIKE '%updated_at%' THEN '✅ Trigger de updated_at OK'
        ELSE '⚠️ Outro trigger'
    END as status
FROM information_schema.triggers 
WHERE event_object_table = 'tarefas_planejamento'
  AND trigger_schema = 'public'
ORDER BY trigger_name;

-- =====================================================
-- 9. PERMISSÕES DO USUÁRIO
-- =====================================================
SELECT '=== PERMISSÕES DO USUÁRIO ===' as secao;

SELECT 
    current_user as usuario,
    has_table_privilege('public', 'tarefas_planejamento', 'SELECT') as pode_ler,
    has_table_privilege('public', 'tarefas_planejamento', 'INSERT') as pode_inserir,
    has_table_privilege('public', 'tarefas_planejamento', 'UPDATE') as pode_atualizar,
    has_table_privilege('public', 'tarefas_planejamento', 'DELETE') as pode_deletar;

-- =====================================================
-- 10. TESTE DE FUNCIONAMENTO
-- =====================================================
SELECT '=== TESTE DE FUNCIONAMENTO ===' as secao;

-- Testar inserção simples
DO $$
BEGIN
    INSERT INTO tarefas_planejamento (titulo, coluna, criador_id) 
    VALUES ('Teste Funcionamento', 'backlog', COALESCE((SELECT id FROM profiles LIMIT 1), gen_random_uuid()));
    
    IF EXISTS (SELECT 1 FROM tarefas_planejamento WHERE titulo = 'Teste Funcionamento') THEN
        RAISE NOTICE '✅ TESTE OK: Sistema funcionando corretamente';
    ELSE
        RAISE NOTICE '❌ TESTE FALHOU: Problema no sistema';
    END IF;
END $$;

-- =====================================================
-- 11. RESUMO FINAL
-- =====================================================
SELECT '=== RESUMO FINAL ===' as secao;

SELECT 
    'Verificação concluída' as status,
    to_char(now(), 'DD/MM/YYYY HH24:MI') as data_hora,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tarefas_planejamento')
             AND EXISTS (SELECT FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tarefas_planejamento')
        THEN '✅ Sistema parece OK'
        ELSE '⚠️ Verificar configuração'
    END as avaliacao_geral;
