-- SCRIPT COMPLETO DE VERIFICAÇÃO DO SISTEMA DE PLANEJAMENTO
-- Execute este SQL no painel do Supabase para diagnosticar problemas

-- =====================================================
-- 1. VERIFICAR ESTRUTURA DA TABELA PRINCIPAL
-- =====================================================
SELECT '=== ESTRUTURA DA TABELA tarefas_planejamento ===' as secao;

-- Colunas da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tarefas_planejamento'
ORDER BY ordinal_position;

-- Constraints da tabela
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'tarefas_planejamento'::regclass
ORDER BY conname;

-- =====================================================
-- 2. VERIFICAR ÍNDICES
-- =====================================================
SELECT '=== ÍNDICES DA TABELA ===' as secao;

SELECT 
    indexname,
    indexdef,
    schemaname,
    tablename
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'tarefas_planejamento';

-- =====================================================
-- 3. VERIFICAR RLS POLICIES
-- =====================================================
SELECT '=== RLS POLICIES ===' as secao;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'tarefas_planejamento';

-- =====================================================
-- 4. VERIFICAR DADOS EXISTENTES
-- =====================================================
SELECT '=== DADOS EXISTENTES ===' as secao;

-- Total de tarefas
SELECT 
    COUNT(*) as total_tarefas,
    COUNT(CASE WHEN coluna = 'backlog' THEN 1 END) as backlog,
    COUNT(CASE WHEN coluna = 'semana_atual' THEN 1 END) as semana_atual,
    COUNT(CASE WHEN coluna = 'em_andamento' THEN 1 END) as em_andamento,
    COUNT(CASE WHEN coluna = 'em_validacao' THEN 1 END) as em_validacao,
    COUNT(CASE WHEN coluna = 'concluido' THEN 1 END) as concluido,
    COUNT(CASE WHEN coluna = 'indicadores' THEN 1 END) as indicadores
FROM tarefas_planejamento;

-- Tarefas por coluna
SELECT 
    coluna,
    COUNT(*) as quantidade,
    ARRAY_AGG(titulo) as titulos_das_tarefas
FROM tarefas_planejamento 
GROUP BY coluna 
ORDER BY coluna;

-- Verificar valores únicos em campos importantes
SELECT '=== VALORES ÚNICOS ===' as secao;

SELECT 
    'etiqueta' as campo,
    COUNT(DISTINCT etiqueta) as valores_unicos,
    ARRAY_AGG(DISTINCT etiqueta) as lista_valores
FROM tarefas_planejamento 
WHERE etiqueta IS NOT NULL AND etiqueta != ''
GROUP BY 1

UNION ALL

SELECT 
    'prioridade' as campo,
    COUNT(DISTINCT prioridade) as valores_unicos,
    ARRAY_AGG(DISTINCT prioridade) as lista_valores
FROM tarefas_planejamento 
WHERE prioridade IS NOT NULL AND prioridade != ''
GROUP BY 1;

-- =====================================================
-- 5. VERIFICAR RELACIONAMENTO COM PROFILES
-- =====================================================
SELECT '=== RELACIONAMENTO COM PROFILES ===' as secao;

-- Verificar se profiles existe e tem dados
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN full_name IS NOT NULL AND full_name != '' THEN 1 END) as profiles_com_nome,
    COUNT(CASE WHEN id IS NOT NULL THEN 1 END) as ids_validos
FROM profiles;

-- Verificar se criador_id existe em profiles
SELECT 
    COUNT(*) as tarefas_com_criador_valido,
    COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) as tarefas_com_criador_encontrado,
    COUNT(CASE WHEN p.id IS NULL THEN 1 END) as tarefas_com_criador_inexistente
FROM tarefas_planejamento t
LEFT JOIN profiles p ON t.criador_id = p.id;

-- Verificar se responsavel_id existe em profiles
SELECT 
    COUNT(*) as tarefas_com_responsavel_valido,
    COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) as tarefas_com_responsavel_encontrado,
    COUNT(CASE WHEN p.id IS NULL THEN 1 END) as tarefas_com_responsavel_inexistente,
    COUNT(CASE WHEN t.responsavel_id IS NULL THEN 1 END) as tarefas_sem_responsavel
FROM tarefas_planejamento t
LEFT JOIN profiles p ON t.responsavel_id = p.id;

-- =====================================================
-- 6. VERIFICAR TRIGGERS
-- =====================================================
SELECT '=== TRIGGERS ===' as secao;

SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_condition,
    action_orientation
FROM information_schema.triggers 
WHERE event_object_table = 'tarefas_planejamento'
  AND trigger_schema = 'public';

-- =====================================================
-- 7. VERIFICAR PERMISSÕES DO USUÁRIO ATUAL
-- =====================================================
SELECT '=== VERIFICAÇÃO DE PERMISSÕES ===' as secao;

-- Verificar se usuário atual tem permissão de SELECT
SELECT 
    has_table_privilege('public', 'tarefas_planejamento', 'SELECT') as pode_selecionar,
    has_table_privilege('public', 'tarefas_planejamento', 'INSERT') as pode_inserir,
    has_table_privilege('public', 'tarefas_planejamento', 'UPDATE') as pode_atualizar,
    has_table_privilege('public', 'tarefas_planejamento', 'DELETE') as pode_deletar;

-- =====================================================
-- 8. VERIFICAR MIGRATIONS APLICADAS
-- =====================================================
SELECT '=== MIGRATIONS APLICADAS ===' as secao;

-- Verificar se tabela de migrations existe
SELECT 
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name = 'schema_migrations'
    ) as migrations_table_exists,
    'Tabela de migrations não encontrada ou inacessível' as status;

-- =====================================================
-- 9. TESTES DE INSERT/UPDATE
-- =====================================================
SELECT '=== TESTES ===' as secao;

-- Testar inserção com dados mínimos
DO $$
BEGIN
    -- Criar tarefa de teste
    INSERT INTO tarefas_planejamento (
        id, titulo, coluna, criador_id
    ) VALUES (
        gen_random_uuid(),
        'Tarefa de Teste Diagnóstico',
        'backlog',
        COALESCE((SELECT id FROM profiles LIMIT 1), gen_random_uuid())
    );
    
    -- Tentar atualizar com etiqueta vazia
    UPDATE tarefas_planejamento 
    SET etiqueta = ''
    WHERE titulo = 'Tarefa de Teste Diagnóstico';
    
    -- Verificar se funcionou
    IF FOUND THEN
        RAISE NOTICE '✅ TESTE OK: Inserção e atualização funcionam';
    ELSE
        RAISE NOTICE '❌ TESTE FALHOU: Problema na inserção/atualização';
    END IF;
END $$;

-- =====================================================
-- 10. RESUMO FINAL
-- =====================================================
SELECT '=== RESUMO DA VERIFICAÇÃO ===' as secao;

SELECT 
    'Verificação concluída em ' || to_char(now(), 'DD/MM/YYYY HH24:MI:SS') as status,
    'Execute este script novamente se encontrar problemas' as recomendacao;
