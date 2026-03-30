-- SQL MINIMALISTA para criar tabela tarefas_planejamento
-- Execute passo a passo no Supabase SQL Editor

-- Passo 1: Criar tabela básica
CREATE TABLE tarefas_planejamento (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    coluna VARCHAR(50) NOT NULL DEFAULT 'backlog',
    responsavel_id UUID,
    criador_id UUID NOT NULL,
    prioridade VARCHAR(20) DEFAULT 'media',
    data_inicio DATE,
    data_limite DATE,
    data_conclusao DATE,
    tags TEXT[],
    ordem INTEGER DEFAULT 0,
    arquivos JSONB,
    comentarios JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Passo 2: Verificar se foi criada
SELECT 'OK - Tabela criada' as status,
       COUNT(*) as total_registros
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'tarefas_planejamento';
