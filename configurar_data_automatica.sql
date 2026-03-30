-- SCRIPT PARA CONFIGURAR DATA DE CRIAÇÃO AUTOMÁTICA
-- Execute este SQL no painel do Supabase

-- =====================================================
-- 1. ADICIONAR DEFAULT VALUE AO CAMPO created_at
-- =====================================================

-- Verificar se a coluna created_at existe e seu tipo atual
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tarefas_planejamento'
  AND column_name = 'created_at';

-- Adicionar DEFAULT NOW() ao campo created_at (se ainda não tiver)
ALTER TABLE tarefas_planejamento 
ALTER COLUMN created_at SET DEFAULT NOW();

-- =====================================================
-- 2. VERIFICAR SE O TRIGGER DE updated_at EXISTE
-- =====================================================

-- Verificar se existe trigger para updated_at
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'tarefas_planejamento'
  AND trigger_schema = 'public'
  AND trigger_name LIKE '%updated_at%';

-- =====================================================
-- 3. CRIAR FUNÇÃO E TRIGGER PARA updated_at (se não existir)
-- =====================================================

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar updated_at (se não existir)
DROP TRIGGER IF EXISTS update_tarefas_planejamento_updated_at ON tarefas_planejamento;

CREATE TRIGGER update_tarefas_planejamento_updated_at
    BEFORE UPDATE ON tarefas_planejamento
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. VERIFICAR RESULTADO
-- =====================================================

-- Verificar se as alterações foram aplicadas
SELECT 
    'Configurações aplicadas' as status,
    column_name,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'tarefas_planejamento'
  AND column_name IN ('created_at', 'updated_at')
ORDER BY column_name;

-- =====================================================
-- 5. TESTAR INSERÇÃO COM DATA AUTOMÁTICA
-- =====================================================

-- Testar inserção sem especificar created_at
INSERT INTO tarefas_planejamento (
    titulo, 
    coluna, 
    criador_id
) VALUES (
    'Teste Data Automática',
    'backlog',
    COALESCE((SELECT id FROM profiles LIMIT 1), gen_random_uuid())
);

-- Verificar se a data foi preenchida automaticamente
SELECT 
    titulo,
    created_at,
    updated_at,
    CASE 
        WHEN created_at IS NOT NULL THEN '✅ Data de criação OK'
        ELSE '❌ Data de criação falhou'
    END as status_criacao,
    CASE 
        WHEN updated_at IS NOT NULL THEN '✅ Data de atualização OK'
        ELSE '❌ Data de atualização falhou'
    END as status_atualizacao
FROM tarefas_planejamento 
WHERE titulo = 'Teste Data Automática';

-- =====================================================
-- 6. LIMPAR DADOS DE TESTE
-- =====================================================

-- Remover tarefa de teste
DELETE FROM tarefas_planejamento 
WHERE titulo IN ('Teste Data Automática', 'Teste constraint removida');

SELECT 'Configuração de datas automáticas concluída!' as resultado_final;
