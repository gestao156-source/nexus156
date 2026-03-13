/*
  # Create Historico Procedimentos Table
  
  This migration creates the historico_procedimentos table to replace the 
  observacoes field with a proper audit trail of procedures/activities.
  
  Features:
  - Immutable records (no updates/deletes)
  - Automatic timestamp
  - User tracking (denormalized for performance)
  - Applies to both solicitacoes and demandas
  - RLS policies for security
*/

-- Create historico_procedimentos table
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
CREATE INDEX idx_historico_procedimentos_item ON historico_procedimentos(item_id, item_tipo);
CREATE INDEX idx_historico_procedimentos_created_at ON historico_procedimentos(created_at DESC);
CREATE INDEX idx_historico_procedimentos_usuario ON historico_procedimentos(usuario_id);

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_historico_procedimentos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER historico_procedimentos_updated_at
  BEFORE UPDATE ON historico_procedimentos
  FOR EACH ROW
  EXECUTE FUNCTION update_historico_procedimentos_updated_at();

-- RLS Policies

-- Users can view procedimentos for items they have access to
CREATE POLICY "Users can view relevant procedimentos"
  ON historico_procedimentos FOR SELECT
  TO authenticated
  USING (
    -- Can view if they are the item creator
    EXISTS (
      SELECT 1 FROM solicitacoes s
      WHERE s.id = historico_procedimentos.item_id 
      AND historico_procedimentos.item_tipo = 'solicitacao'
      AND s.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM demandas d
      WHERE d.id = historico_procedimentos.item_id 
      AND historico_procedimentos.item_tipo = 'demanda'
      AND d.user_id = auth.uid()
    ) OR
    -- Can view if they are the item responsável
    EXISTS (
      SELECT 1 FROM solicitacoes s
      JOIN profiles p ON p.id = s.responsavel::uuid
      WHERE s.id = historico_procedimentos.item_id 
      AND historico_procedimentos.item_tipo = 'solicitacao'
      AND p.id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM demandas d
      JOIN profiles p ON p.id = d.responsavel::uuid
      WHERE d.id = historico_procedimentos.item_id 
      AND historico_procedimentos.item_tipo = 'demanda'
      AND p.id = auth.uid()
    ) OR
    -- Admins can view all
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can insert procedimentos for items they have access to
CREATE POLICY "Users can insert relevant procedimentos"
  ON historico_procedimentos FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Can insert if they are the item creator
    EXISTS (
      SELECT 1 FROM solicitacoes s
      WHERE s.id = historico_procedimentos.item_id 
      AND historico_procedimentos.item_tipo = 'solicitacao'
      AND s.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM demandas d
      WHERE d.id = historico_procedimentos.item_id 
      AND historico_procedimentos.item_tipo = 'demanda'
      AND d.user_id = auth.uid()
    ) OR
    -- Can insert if they are the item responsável
    EXISTS (
      SELECT 1 FROM solicitacoes s
      JOIN profiles p ON p.id = s.responsavel::uuid
      WHERE s.id = historico_procedimentos.item_id 
      AND historico_procedimentos.item_tipo = 'solicitacao'
      AND p.id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM demandas d
      JOIN profiles p ON p.id = d.responsavel::uuid
      WHERE d.id = historico_procedimentos.item_id 
      AND historico_procedimentos.item_tipo = 'demanda'
      AND p.id = auth.uid()
    ) OR
    -- Admins can insert for all
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- No update policy - procedimentos are immutable
-- No delete policy - procedimentos cannot be deleted (except by admin in special cases)

-- RPC Function to add procedimento with user info auto-populated
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
BEGIN
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

-- RPC Function to get historico for an item
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
