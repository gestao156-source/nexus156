/*
  Clean Reset - Solução Definitiva
  
  Remove TUDO do banco e recria do zero.
  ÚLTIMA RECURSO quando tudo falhar.
*/

-- Remover todas as tabelas
DROP TABLE IF EXISTS solicitacoes CASCADE;
DROP TABLE IF EXISTS demandas CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Remover todas as funções
DROP FUNCTION IF EXISTS backup_creator_info();
DROP FUNCTION IF EXISTS validate_endereco_coordinates();
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS validate_coordinates();
DROP FUNCTION IF EXISTS format_endereco_completo();
DROP FUNCTION IF EXISTS simple_backup_creator();

-- Remover todas as views
DROP VIEW IF EXISTS solicitacoes_com_endereco;
DROP VIEW IF EXISTS demandas_com_endereco;

-- Recriar tabela profiles limpa
CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Recriar tabela solicitacoes limpa
CREATE TABLE solicitacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assunto text NOT NULL,
  protocolo text NOT NULL,
  status text NOT NULL DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'em_analise', 'finalizado')),
  data_inicio date,
  data_contato date,
  data_finalizado date,
  observacoes text DEFAULT '',
  responsavel text DEFAULT '',
  ponto_contato text DEFAULT '',
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by_user_name text,
  created_by_user_email text,
  endereco_rua text,
  endereco_numero text,
  endereco_bairro text,
  endereco_localidade text,
  endereco_cep text,
  endereco_complemento text,
  latitude decimal(10,8),
  longitude decimal(11,8)
);

-- Recriar tabela demandas limpa
CREATE TABLE demandas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assunto text NOT NULL,
  protocolo text NOT NULL,
  status text NOT NULL DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'em_analise', 'finalizado')),
  data_inicio date,
  data_contato date,
  data_finalizado date,
  observacoes text DEFAULT '',
  responsavel text DEFAULT '',
  ponto_contato text DEFAULT '',
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by_user_name text,
  created_by_user_email text,
  endereco_rua text,
  endereco_numero text,
  endereco_bairro text,
  endereco_localidade text,
  endereco_cep text,
  endereco_complemento text,
  latitude decimal(10,8),
  longitude decimal(11,8)
);

-- Garantir acesso total (sem RLS por enquanto)
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON solicitacoes TO anon;
GRANT ALL ON solicitacoes TO authenticated;
GRANT ALL ON demandas TO anon;
GRANT ALL ON demandas TO authenticated;

-- Criar índices básicos
CREATE INDEX idx_solicitacoes_status ON solicitacoes(status);
CREATE INDEX idx_solicitacoes_user_id ON solicitacoes(user_id);
CREATE INDEX idx_demandas_status ON demandas(status);
CREATE INDEX idx_demandas_user_id ON demandas(user_id);

-- Log de reset
DO $$
BEGIN
    RAISE LOG 'Banco resetado completamente em % - Todas as tabelas recriadas';
END;
$$ LANGUAGE plpgsql;
