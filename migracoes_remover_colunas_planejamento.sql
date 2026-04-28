-- Migration para remover colunas 'semana_atual' e 'indicadores' do planejamento
-- Mover tarefas existentes para o backlog antes de remover as colunas

-- 1. Verificar quantas tarefas existem nas colunas que serão removidas
SELECT 
    coluna,
    COUNT(*) as quantidade_tarefas
FROM planejamento_tarefas 
WHERE coluna IN ('semana_atual', 'indicadores')
GROUP BY coluna;

-- 2. Mover todas as tarefas das colunas removidas para o backlog
UPDATE planejamento_tarefas 
SET coluna = 'backlog' 
WHERE coluna IN ('semana_atual', 'indicadores');

-- 3. Verificar se a migração foi bem-sucedida
SELECT 
    coluna,
    COUNT(*) as quantidade_tarefas
FROM planejamento_tarefas 
GROUP BY coluna
ORDER BY coluna;

-- 4. Verificar se há alguma constraint ou check que precise ser atualizada
SELECT 
    conname,
    consrc
FROM pg_constraint 
WHERE conrelid = 'planejamento_tarefas'::regclass 
AND contype = 'c';

-- 5. Se houver uma constraint CHECK para as colunas, será necessário atualizá-la
-- Exemplo (se existir):
-- ALTER TABLE planejamento_tarefas DROP CONSTRAINT planejamento_tarefas_coluna_check;
-- ALTER TABLE planejamento_tarefas ADD CONSTRAINT planejamento_tarefas_coluna_check 
--   CHECK (coluna IN ('backlog', 'em_andamento', 'em_validacao', 'concluido'));
