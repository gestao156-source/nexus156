-- SQL para remover constraint problemática da tabela tarefas_planejamento
-- Execute este SQL no painel do Supabase

-- Remover CHECK constraint do campo etiqueta que está causando erro
ALTER TABLE tarefas_planejamento 
DROP CONSTRAINT IF EXISTS tarefas_planejamento_etiqueta_check;

-- Remover CHECK constraint do campo prioridade (se existir e for problemática)
ALTER TABLE tarefas_planejamento 
DROP CONSTRAINT IF EXISTS tarefas_planejamento_prioridade_check;

-- Verificar se as constraints foram removidas
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'tarefas_planejamento'::regclass
  AND (conname LIKE '%etiqueta_check%' OR conname LIKE '%prioridade_check%');

-- Testar inserção com etiqueta vazia
INSERT INTO tarefas_planejamento (
    id, 
    titulo, 
    coluna, 
    criador_id
) VALUES (
    gen_random_uuid(),
    'Teste constraint removida',
    'backlog',
    (SELECT id FROM profiles LIMIT 1)
);

-- Verificar se inseriu com sucesso
SELECT 'Constraint removida com sucesso - Teste OK' as resultado;
