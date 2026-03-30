-- Migration: Criar tabelas do sistema de planejamento
-- Data: 2026-03-30
-- Descrição: Tabelas para gestão de tarefas estilo Trello/Kanban

-- Tabela principal de tarefas de planejamento
CREATE TABLE IF NOT EXISTS tarefas_planejamento (
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

-- Tabela para configurações das etiquetas (opcional - pode ser fixa no código)
CREATE TABLE IF NOT EXISTS etiquetas_planejamento (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    cor VARCHAR(20) NOT NULL, -- Cor em formato hex ou nome
    descricao TEXT,
    ativa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir etiquetas padrão
INSERT INTO etiquetas_planejamento (nome, cor, descricao) VALUES
    ('diagnostico', '#3B82F6', 'Análise e investigação de problemas'),
    ('padronizacao', '#EAB308', 'Criação de padrões e processos'),
    ('capacitacao', '#22C55E', 'Treinamento e desenvolvimento'),
    ('monitoramento', '#EF4444', 'Acompanhamento e controle')
ON CONFLICT (nome) DO NOTHING;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tarefas_planejamento_coluna ON tarefas_planejamento(coluna);
CREATE INDEX IF NOT EXISTS idx_tarefas_planejamento_responsavel ON tarefas_planejamento(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_planejamento_criador ON tarefas_planejamento(criador_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_planejamento_etiqueta ON tarefas_planejamento(etiqueta);
CREATE INDEX IF NOT EXISTS idx_tarefas_planejamento_data_limite ON tarefas_planejamento(data_limite);

-- RLS (Row Level Security)
ALTER TABLE tarefas_planejamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE etiquetas_planejamento ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para tarefas_planejamento
CREATE POLICY "Usuários podem ver todas as tarefas" ON tarefas_planejamento
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem criar tarefas" ON tarefas_planejamento
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND criador_id = auth.uid());

CREATE POLICY "Usuários podem atualizar próprias tarefas ou se admin" ON tarefas_planejamento
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND 
        (criador_id = auth.uid() OR 
         (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
    );

CREATE POLICY "Apenas admin pode deletar tarefas" ON tarefas_planejamento
    FOR DELETE USING (
        auth.role() = 'authenticated' AND 
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );

-- Políticas para etiquetas (todos podem ver, apenas admin gerenciar)
CREATE POLICY "Todos podem ver etiquetas" ON etiquetas_planejamento
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Apenas admin pode gerenciar etiquetas" ON etiquetas_planejamento
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );

-- Trigger para atualizar updated_at
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

-- Função para buscar tarefas com informações de responsável
CREATE OR REPLACE FUNCTION buscar_tarefas_com_responsavel()
RETURNS TABLE (
    id UUID,
    titulo VARCHAR(255),
    descricao TEXT,
    coluna VARCHAR(50),
    etiqueta VARCHAR(30),
    responsavel_id UUID,
    responsavel_nome VARCHAR,
    criador_id UUID,
    criador_nome VARCHAR,
    prioridade VARCHAR(20),
    data_inicio DATE,
    data_limite DATE,
    data_conclusao DATE,
    tags TEXT[],
    ordem INTEGER,
    arquivos JSONB,
    comentarios JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.titulo,
        t.descricao,
        t.coluna,
        t.etiqueta,
        t.responsavel_id,
        p_responsavel.full_name::VARCHAR as responsavel_nome,
        t.criador_id,
        p_criador.full_name::VARCHAR as criador_nome,
        t.prioridade,
        t.data_inicio,
        t.data_limite,
        t.data_conclusao,
        t.tags,
        t.ordem,
        t.arquivos,
        t.comentarios,
        t.created_at,
        t.updated_at
    FROM tarefas_planejamento t
    LEFT JOIN profiles p_responsavel ON t.responsavel_id = p_responsavel.id
    LEFT JOIN profiles p_criador ON t.criador_id = p_criador.id
    ORDER BY t.coluna, t.ordem, t.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
