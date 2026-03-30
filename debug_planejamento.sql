-- SQL para verificar e corrigir problemas na tabela tarefas_planejamento
-- Execute este SQL no painel do Supabase para debug

-- 1. Verificar se a tabela existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'tarefas_planejamento'
) AS tabela_existe;

-- 2. Verificar estrutura da tabela
SELECT 
   column_name, 
   data_type, 
   is_nullable,
   column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tarefas_planejamento'
ORDER BY ordinal_position;

-- 3. Verificar se as RLS policies existem
SELECT 
   schemaname,
   tablename,
   policyname,
   permissive,
   roles,
   cmd,
   qual
FROM pg_policies 
WHERE tablename = 'tarefas_planejamento';

-- 4. Verificar se o trigger existe
SELECT 
   trigger_name,
   event_manipulation,
   action_timing,
   action_condition,
   action_orientation,
   action_reference
FROM information_schema.triggers 
WHERE event_object_table = 'tarefas_planejamento';

-- 5. Testar inserção simples
INSERT INTO tarefas_planejamento (
    id, 
    titulo, 
    coluna, 
    criador_id
) VALUES (
    gen_random_uuid(),
    'Teste Debug',
    'backlog',
    (SELECT id FROM profiles LIMIT 1)
) ON CONFLICT (id) DO NOTHING;

-- 6. Verificar dados inseridos
SELECT 
    id,
    titulo,
    coluna,
    criador_id,
    created_at
FROM tarefas_planejamento 
WHERE titulo = 'Teste Debug'
ORDER BY created_at DESC
LIMIT 5;
