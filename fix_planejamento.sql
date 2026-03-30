-- SQL CORRIGIDO para criar tabelas do sistema de planejamento
-- Execute este SQL no painel do Supabase (SQL Editor)

-- 1. Remover tabela se existir (para começar do zero)
DROP TABLE IF EXISTS tarefas_planejamento CASCADE;

-- 2. Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Usuários podem ver todas as tarefas" ON tarefas_planejamento;
DROP POLICY IF EXISTS "Usuários podem criar tarefas" ON tarefas_planejamento;
DROP POLICY IF EXISTS "Usuários podem atualizar próprias tarefas ou se admin" ON tarefas_planejamento;
DROP POLICY IF EXISTS "Apenas admin pode deletar tarefas" ON tarefas_planejamento;

-- 3. Tabela principal de tarefas de planejamento
CREATE TABLE tarefas_planejamento (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    coluna VARCHAR(50) NOT NULL DEFAULT 'backlog' CHECK (coluna IN ('backlog', 'semana_atual', 'em_andamento', 'em_validacao', 'concluido', 'indicadores')),
    etiqueta VARCHAR(30) CHECK (etiqueta IN ('diagnostico', 'padronizacao', 'capacitacao', 'monitoramento')),
    responsavel_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    criador_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    prioridade VARCHAR(20) DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
    data_inicio DATE,
    data_limite DATE,
    data_conclusao DATE,
    tags TEXT[], -- Array de tags adicionais
    ordem INTEGER DEFAULT 0, -- Para ordenação dentro da coluna
    arquivos JSONB, -- Informações de arquivos anexados
    comentarios JSONB DEFAULT '[]'::jsonb, -- Array de comentários
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Índices para performance
CREATE INDEX idx_tarefas_planejamento_coluna ON tarefas_planejamento(coluna);
CREATE INDEX idx_tarefas_planejamento_responsavel ON tarefas_planejamento(responsavel_id);
CREATE INDEX idx_tarefas_planejamento_criador ON tarefas_planejamento(criador_id);
CREATE INDEX idx_tarefas_planejamento_etiqueta ON tarefas_planejamento(etiqueta);
CREATE INDEX idx_tarefas_planejamento_data_limite ON tarefas_planejamento(data_limite);

-- 5. RLS (Row Level Security)
ALTER TABLE tarefas_planejamento ENABLE ROW LEVEL SECURITY;

-- 6. Políticas de segurança simplificadas
CREATE POLICY "Usuários autenticados podem ver tarefas" ON tarefas_planejamento
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem criar tarefas" ON tarefas_planejamento
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar tarefas" ON tarefas_planejamento
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar tarefas" ON tarefas_planejamento
    FOR DELETE USING (auth.role() = 'authenticated');

-- 7. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tarefas_planejamento_updated_at 
    BEFORE UPDATE ON tarefas_planejamento 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Inserir dados de teste (opcional)
INSERT INTO tarefas_planejamento (
    id, 
    titulo, 
    coluna, 
    criador_id
) VALUES (
    gen_random_uuid(),
    'Tarefa de Teste',
    'backlog',
    (SELECT id FROM profiles LIMIT 1)
);

-- 9. Verificar se tudo foi criado corretamente
SELECT 'Tabela tarefas_planejamento criada com sucesso' as status,
       COUNT(*) as total_tarefas
FROM tarefas_planejamento;
