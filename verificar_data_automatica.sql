-- VERIFICAÇÃO E CORREÇÃO DA DATA AUTOMÁTICA
-- Execute este SQL no Supabase

-- =====================================================
-- 1. VERIFICAR CONFIGURAÇÃO ATUAL DO CAMPO created_at
-- =====================================================
SELECT 
    'Configuração atual de created_at' as verificacao,
    column_name,
    data_type,
    column_default,
    is_nullable,
    CASE 
        WHEN column_default IS NOT NULL THEN '✅ DEFAULT configurado'
        ELSE '❌ SEM DEFAULT - precisa configurar'
    END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tarefas_planejamento'
  AND column_name = 'created_at';

-- =====================================================
-- 2. APLICAR DEFAULT NOW() SE NÃO ESTIVER CONFIGURADO
-- =====================================================

-- Remover qualquer default existente primeiro (para garantir limpeza)
ALTER TABLE tarefas_planejamento 
ALTER COLUMN created_at DROP DEFAULT;

-- Aplicar novo default NOW()
ALTER TABLE tarefas_planejamento 
ALTER COLUMN created_at SET DEFAULT NOW();

-- =====================================================
-- 3. VERIFICAR SE FOI APLICADO
-- =====================================================
SELECT 
    'Configuração após alteração' as verificacao,
    column_name,
    column_default,
    CASE 
        WHEN column_default = 'now()' THEN '✅ DEFAULT NOW() aplicado'
        ELSE '❌ Falha na configuração'
    END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tarefas_planejamento'
  AND column_name = 'created_at';

-- =====================================================
-- 4. TESTAR INSERÇÃO SEM ENVIAR created_at
-- =====================================================

-- Criar tarefa de teste sem campo created_at
INSERT INTO tarefas_planejamento (
    titulo, 
    coluna, 
    criador_id,
    prioridade,
    ordem
) VALUES (
    'Teste Data Auto ' || TO_CHAR(NOW(), 'HH24:MI:SS'),
    'backlog',
    (SELECT id FROM profiles LIMIT 1),
    'media',
    0
);

-- =====================================================
-- 5. VERIFICAR SE A DATA FOI PREENCHIDA
-- =====================================================
SELECT 
    'Resultado do teste' as verificacao,
    titulo,
    created_at,
    CASE 
        WHEN created_at IS NOT NULL THEN '✅ SUCESSO: Data preenchida automaticamente'
        ELSE '❌ FALHA: Data não foi preenchida'
    END as resultado,
    NOW() - created_at as diferenca_tempo
FROM tarefas_planejamento 
WHERE titulo LIKE 'Teste Data Auto%'
ORDER BY created_at DESC
LIMIT 1;

-- =====================================================
-- 6. LIMPAR TESTE
-- =====================================================
DELETE FROM tarefas_planejamento 
WHERE titulo LIKE 'Teste Data Auto%';
