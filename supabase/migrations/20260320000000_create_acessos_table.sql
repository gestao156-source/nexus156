/*
  # Create Acessos Table
  
  Tabela para gerenciar solicitações de acesso ao SISGEP recebidas via WhatsApp
  
  Campos:
  - solicitante_wpp: Nome de quem solicitou via WhatsApp
  - servidor_beneficiado: Nome do servidor que receberá acesso
  - data_solicitacao: Data da solicitação via WhatsApp
  - data_criacao_acesso: Data que o acesso foi criado no SISGEP
  - regional: Regional do servidor beneficiado
  - setor: Setor do servidor beneficiado
  - status: Status do acesso (solicitado, em_andamento, criado, ativo, desativado)
  - responsavel_nexus: Quem criou/gerencia no NEXUS
  - observacoes: Observações adicionais
*/

-- Create acessos table
CREATE TABLE IF NOT EXISTS acessos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitante_wpp text NOT NULL,
  servidor_beneficiado text NOT NULL,
  data_solicitacao date NOT NULL,
  data_criacao_acesso date,
  regional text,
  setor text,
  status text NOT NULL DEFAULT 'solicitado' CHECK (status IN ('solicitado', 'em_andamento', 'criado', 'ativo', 'desativado')),
  responsavel_nexus text,
  observacoes text DEFAULT '',
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE acessos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for acessos (Apenas admin)
CREATE POLICY "Admins can view all acessos"
  ON acessos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert acessos"
  ON acessos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update acessos"
  ON acessos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete acessos"
  ON acessos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add indexes for performance
CREATE INDEX idx_acessos_status ON acessos(status);
CREATE INDEX idx_acessos_data_solicitacao ON acessos(data_solicitacao);
CREATE INDEX idx_acessos_responsavel_nexus ON acessos(responsavel_nexus);
CREATE INDEX idx_acessos_regional ON acessos(regional);
CREATE INDEX idx_acessos_user_id ON acessos(user_id);

-- Add validation constraints
ALTER TABLE acessos ADD CONSTRAINT check_data_criacao_maior_que_solicitacao 
  CHECK (data_criacao_acesso IS NULL OR data_criacao_acesso >= data_solicitacao);

-- Add comments for documentation
COMMENT ON TABLE acessos IS 'Tabela para controle de acessos SISGEP solicitados via WhatsApp';
COMMENT ON COLUMN acessos.solicitante_wpp IS 'Nome de quem solicitou o acesso via WhatsApp';
COMMENT ON COLUMN acessos.servidor_beneficiado IS 'Nome do servidor que receberá o acesso ao SISGEP';
COMMENT ON COLUMN acessos.data_solicitacao IS 'Data em que a solicitação foi recebida via WhatsApp';
COMMENT ON COLUMN acessos.data_criacao_acesso IS 'Data em que o acesso foi efetivamente criado no SISGEP';
COMMENT ON COLUMN acessos.regional IS 'Regional onde o servidor trabalha';
COMMENT ON COLUMN acessos.setor IS 'Setor onde o servidor trabalha';
COMMENT ON COLUMN acessos.status IS 'Status atual da solicitação de acesso';
COMMENT ON COLUMN acessos.responsavel_nexus IS 'Responsável no NEXUS que está gerenciando esta solicitação';
COMMENT ON COLUMN acessos.observacoes IS 'Observações adicionais sobre a solicitação';
