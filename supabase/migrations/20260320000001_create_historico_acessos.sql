/*
  # Create Historico Acessos Table
  
  Tabela para registrar histórico de procedimentos/em andamento dos acessos SISGEP
  Similar ao historico_procedimentos mas específico para acessos
*/

-- Create historico_acessos table
CREATE TABLE IF NOT EXISTS historico_acessos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  acesso_id uuid NOT NULL REFERENCES acessos(id) ON DELETE CASCADE,
  procedimento text NOT NULL,
  usuario_id uuid NOT NULL REFERENCES profiles(id),
  usuario_nome text NOT NULL,
  usuario_email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE historico_acessos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for historico_acessos (Apenas admin)
CREATE POLICY "Admins can view all historico_acessos"
  ON historico_acessos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert historico_acessos"
  ON historico_acessos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete historico_acessos"
  ON historico_acessos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add indexes for performance
CREATE INDEX idx_historico_acessos_acesso_id ON historico_acessos(acesso_id);
CREATE INDEX idx_historico_acessos_created_at ON historico_acessos(created_at DESC);

-- RPC function para obter histórico de acessos
CREATE OR REPLACE FUNCTION obter_historico_acessos(p_acesso_id uuid)
RETURNS TABLE (
  id uuid,
  procedimento text,
  usuario_id uuid,
  usuario_nome text,
  usuario_email text,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ha.id,
    ha.procedimento,
    ha.usuario_id,
    ha.usuario_nome,
    ha.usuario_email,
    ha.created_at
  FROM historico_acessos ha
  WHERE ha.acesso_id = p_acesso_id
  ORDER BY ha.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function para adicionar procedimento ao histórico de acessos
CREATE OR REPLACE FUNCTION adicionar_historico_acesso(
  p_acesso_id uuid,
  p_procedimento text,
  p_usuario_id uuid,
  p_usuario_nome text,
  p_usuario_email text
)
RETURNS uuid AS $$
DECLARE
  v_historico_id uuid;
BEGIN
  INSERT INTO historico_acessos (
    acesso_id,
    procedimento,
    usuario_id,
    usuario_nome,
    usuario_email
  ) VALUES (
    p_acesso_id,
    p_procedimento,
    p_usuario_id,
    p_usuario_nome,
    p_usuario_email
  ) RETURNING id INTO v_historico_id;
  
  RETURN v_historico_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE historico_acessos IS 'Tabela para histórico de procedimentos dos acessos SISGEP';
COMMENT ON COLUMN historico_acessos.procedimento IS 'Descrição do procedimento realizado';
COMMENT ON COLUMN historico_acessos.usuario_nome IS 'Nome do usuário que realizou o procedimento';
