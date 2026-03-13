-- Script completo para implementar o sistema de histórico de procedimentos
-- Execute este script no Supabase SQL Editor

-- 1. Criar tabela historico_procedimentos
CREATE TABLE IF NOT EXISTS historico_procedimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL,                    -- ID da solicitação ou demanda
  item_tipo text NOT NULL CHECK (item_tipo IN ('solicitacao', 'demanda')),
  procedimento text NOT NULL,               -- Descrição do procedimento
  usuario_id uuid NOT NULL,                 -- Quem registrou
  usuario_nome text NOT NULL,               -- Nome do usuário (denormalizado)
  usuario_email text NOT NULL,              -- Email do usuário (denormalizado)
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Constraints
  CONSTRAINT fk_historico_usuario FOREIGN KEY (usuario_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE historico_procedimentos ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_historico_procedimentos_item ON historico_procedimentos(item_id, item_tipo);
CREATE INDEX IF NOT EXISTS idx_historico_procedimentos_created_at ON historico_procedimentos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_historico_procedimentos_usuario ON historico_procedimentos(usuario_id);

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_historico_procedimentos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS historico_procedimentos_updated_at ON historico_procedimentos;
CREATE TRIGGER historico_procedimentos_updated_at
  BEFORE UPDATE ON historico_procedimentos
  FOR EACH ROW
  EXECUTE FUNCTION update_historico_procedimentos_updated_at();

-- RLS Policies - Visualização
DROP POLICY IF EXISTS "Users can view relevant procedimentos" ON historico_procedimentos;
CREATE POLICY "Users can view relevant procedimentos"
  ON historico_procedimentos FOR SELECT
  TO authenticated
  USING (
    -- Admin pode ver tudo
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- Criador do item pode ver
    (EXISTS (
      SELECT 1 FROM solicitacoes s
      WHERE s.id = historico_procedimentos.item_id 
      AND historico_procedimentos.item_tipo = 'solicitacao'
      AND s.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM demandas d
      WHERE d.id = historico_procedimentos.item_id 
      AND historico_procedimentos.item_tipo = 'demanda'
      AND d.user_id = auth.uid()
    ))
    OR
    -- Responsável pelo item pode ver
    (EXISTS (
      SELECT 1 FROM solicitacoes s
      WHERE s.id = historico_procedimentos.item_id 
      AND historico_procedimentos.item_tipo = 'solicitacao'
      AND s.responsavel IS NOT NULL
      AND s.responsavel::text = auth.uid()::text
    ) OR EXISTS (
      SELECT 1 FROM demandas d
      WHERE d.id = historico_procedimentos.item_id 
      AND historico_procedimentos.item_tipo = 'demanda'
      AND d.responsavel IS NOT NULL
      AND d.responsavel::text = auth.uid()::text
    ))
  );

-- RLS Policies - Inserção
DROP POLICY IF EXISTS "Users can insert relevant procedimentos" ON historico_procedimentos;
CREATE POLICY "Users can insert relevant procedimentos"
  ON historico_procedimentos FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Admin pode inserir em qualquer item
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- Criador do item pode inserir
    (EXISTS (
      SELECT 1 FROM solicitacoes s
      WHERE s.id = historico_procedimentos.item_id 
      AND historico_procedimentos.item_tipo = 'solicitacao'
      AND s.user_id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM demandas d
      WHERE d.id = historico_procedimentos.item_id 
      AND historico_procedimentos.item_tipo = 'demanda'
      AND d.user_id = auth.uid()
    ))
    OR
    -- Responsável pelo item pode inserir
    (EXISTS (
      SELECT 1 FROM solicitacoes s
      WHERE s.id = historico_procedimentos.item_id 
      AND historico_procedimentos.item_tipo = 'solicitacao'
      AND s.responsavel IS NOT NULL
      AND s.responsavel::text = auth.uid()::text
    ) OR EXISTS (
      SELECT 1 FROM demandas d
      WHERE d.id = historico_procedimentos.item_id 
      AND historico_procedimentos.item_tipo = 'demanda'
      AND d.responsavel IS NOT NULL
      AND d.responsavel::text = auth.uid()::text
    ))
  );

-- RPC Functions
CREATE OR REPLACE FUNCTION adicionar_procedimento(
  p_item_id uuid,
  p_item_tipo text,
  p_procedimento text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_usuario_id uuid := auth.uid();
  v_usuario_nome text;
  v_usuario_email text;
  v_procedimento_id uuid;
  v_tem_permissao BOOLEAN;
BEGIN
  -- Verificar permissões básicas
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = v_usuario_id
  ) THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;
  
  -- Verificar se é admin
  SELECT (role = 'admin') INTO v_tem_permissao
  FROM profiles
  WHERE id = v_usuario_id;
  
  -- Se não for admin, verificar se tem acesso ao item
  IF NOT v_tem_permissao THEN
    IF p_item_tipo = 'solicitacao' THEN
      SELECT (user_id = v_usuario_id OR (responsavel IS NOT NULL AND responsavel::text = v_usuario_id::text)) INTO v_tem_permissao
      FROM solicitacoes
      WHERE id = p_item_id;
    ELSIF p_item_tipo = 'demanda' THEN
      SELECT (user_id = v_usuario_id OR (responsavel IS NOT NULL AND responsavel::text = v_usuario_id::text)) INTO v_tem_permissao
      FROM demandas
      WHERE id = p_item_id;
    END IF;
    
    IF NOT v_tem_permissao THEN
      RAISE EXCEPTION 'Usuário não tem permissão para adicionar procedimentos neste item';
    END IF;
  END IF;
  
  -- Get user info
  SELECT full_name, email INTO v_usuario_nome, v_usuario_email
  FROM profiles
  WHERE id = v_usuario_id;
  
  -- Insert procedimento
  INSERT INTO historico_procedimentos (
    item_id, item_tipo, procedimento, usuario_id, usuario_nome, usuario_email
  ) VALUES (
    p_item_id, p_item_tipo, p_procedimento, v_usuario_id, v_usuario_nome, v_usuario_email
  ) RETURNING id INTO v_procedimento_id;
  
  RETURN v_procedimento_id;
END;
$$;

CREATE OR REPLACE FUNCTION obter_historico_procedimentos(
  p_item_id uuid,
  p_item_tipo text
)
RETURNS TABLE (
  id uuid,
  procedimento text,
  usuario_id uuid,
  usuario_nome text,
  usuario_email text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hp.id,
    hp.procedimento,
    hp.usuario_id,
    hp.usuario_nome,
    hp.usuario_email,
    hp.created_at
  FROM historico_procedimentos hp
  WHERE hp.item_id = p_item_id AND hp.item_tipo = p_item_tipo
  ORDER BY hp.created_at DESC;
END;
$$;

-- Migrar observações existentes (se o campo ainda existir)
DO $$
DECLARE
  solicitacoes_count INTEGER := 0;
  demandas_count INTEGER := 0;
BEGIN
  -- Verificar se o campo observacoes ainda existe em solicitacoes
  BEGIN
    SELECT COUNT(*) INTO solicitacoes_count
    FROM information_schema.columns 
    WHERE table_name = 'solicitacoes' AND column_name = 'observacoes';
    
    IF solicitacoes_count > 0 THEN
      -- Migrar observações de solicitacoes
      INSERT INTO historico_procedimentos (
        item_id, item_tipo, procedimento, usuario_id, usuario_nome, usuario_email, created_at, updated_at
      )
      SELECT 
        s.id, 
        'solicitacao', 
        CASE 
          WHEN s.observacoes IS NOT NULL AND TRIM(s.observacoes) != '' THEN 
            'Observação original: ' || TRIM(s.observacoes)
          ELSE 
            'Observação original: Sem observações anteriores'
        END,
        COALESCE(s.user_id, '00000000-0000-0000-0000-000000000000'),
        COALESCE(p_criador.full_name, p_responsavel.full_name, 'Sistema'),
        COALESCE(p_criador.email, p_responsavel.email, 'sistema@exemplo.com'),
        COALESCE(s.created_at, NOW()),
        NOW()
      FROM solicitacoes s
      LEFT JOIN profiles p_criador ON p_criador.id = s.user_id
      LEFT JOIN profiles p_responsavel ON p_responsavel.id = s.responsavel::uuid
      WHERE s.id IS NOT NULL;
      
      RAISE NOTICE 'Observações de solicitacoes migradas com sucesso';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Campo observacoes não encontrado em solicitacoes ou erro na migração: %', SQLERRM;
  END;
  
  -- Verificar se o campo observacoes ainda existe em demandas
  BEGIN
    SELECT COUNT(*) INTO demandas_count
    FROM information_schema.columns 
    WHERE table_name = 'demandas' AND column_name = 'observacoes';
    
    IF demandas_count > 0 THEN
      -- Migrar observações de demandas
      INSERT INTO historico_procedimentos (
        item_id, item_tipo, procedimento, usuario_id, usuario_nome, usuario_email, created_at, updated_at
      )
      SELECT 
        d.id, 
        'demanda', 
        CASE 
          WHEN d.observacoes IS NOT NULL AND TRIM(d.observacoes) != '' THEN 
            'Observação original: ' || TRIM(d.observacoes)
          ELSE 
            'Observação original: Sem observações anteriores'
        END,
        COALESCE(d.user_id, '00000000-0000-0000-0000-000000000000'),
        COALESCE(p_criador.full_name, p_responsavel.full_name, 'Sistema'),
        COALESCE(p_criador.email, p_responsavel.email, 'sistema@exemplo.com'),
        COALESCE(d.created_at, NOW()),
        NOW()
      FROM demandas d
      LEFT JOIN profiles p_criador ON p_criador.id = d.user_id
      LEFT JOIN profiles p_responsavel ON p_responsavel.id = d.responsavel::uuid
      WHERE d.id IS NOT NULL;
      
      RAISE NOTICE 'Observações de demandas migradas com sucesso';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Campo observacoes não encontrado em demandas ou erro na migração: %', SQLERRM;
  END;
  
  RAISE NOTICE '=== IMPLEMENTAÇÃO DO HISTÓRICO CONCLUÍDA ===';
END $$;

-- Verificação final
DO $$
DECLARE
  table_exists INTEGER;
  total_procedimentos INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_exists
  FROM information_schema.tables 
  WHERE table_name = 'historico_procedimentos';
  
  IF table_exists > 0 THEN
    SELECT COUNT(*) INTO total_procedimentos FROM historico_procedimentos;
    
    RAISE NOTICE '✅ Tabela historico_procedimentos criada com sucesso';
    RAISE NOTICE '📊 Total de procedimentos registrados: %', total_procedimentos;
    RAISE NOTICE '🔐 RLS policies aplicadas';
    RAISE NOTICE '⚡ Índices criados para performance';
    RAISE NOTICE '🔧 RPC functions disponíveis';
  ELSE
    RAISE NOTICE '❌ Erro: Tabela historico_procedimentos não foi criada';
  END IF;
END $$;
