/*
  Fresh Start - Create Clean Tables
  
  Cria tabelas completamente novas sem RLS para substituir
  as tabelas problemáticas e migrar os dados.
*/

-- Criar tabelas novas sem RLS
CREATE TABLE IF NOT EXISTS solicitacoes_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assunto TEXT NOT NULL,
  protocolo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'em_analise', 'finalizado')),
  data_inicio DATE,
  data_contato DATE,
  data_finalizado DATE,
  observacoes TEXT DEFAULT '',
  responsavel TEXT DEFAULT '',
  ponto_contato TEXT DEFAULT '',
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_user_name TEXT,
  created_by_user_email TEXT,
  endereco_rua TEXT,
  endereco_numero TEXT,
  endereco_bairro TEXT,
  endereco_localidade TEXT,
  endereco_cep TEXT,
  endereco_complemento TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8)
);

CREATE TABLE IF NOT EXISTS demandas_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assunto TEXT NOT NULL,
  protocolo TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'em_analise', 'finalizado')),
  data_inicio DATE,
  data_contato DATE,
  data_finalizado DATE,
  observacoes TEXT DEFAULT '',
  responsavel TEXT DEFAULT '',
  ponto_contato TEXT DEFAULT '',
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_user_name TEXT,
  created_by_user_email TEXT,
  endereco_rua TEXT,
  endereco_numero TEXT,
  endereco_bairro TEXT,
  endereco_localidade TEXT,
  endereco_cep TEXT,
  endereco_complemento TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8)
);

CREATE TABLE IF NOT EXISTS profiles_new (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID
);

-- Migrar dados se as tabelas originais existirem
INSERT INTO profiles_new (id, email, full_name, role, created_at, updated_at, deleted_at, deleted_by)
SELECT id, email, full_name, role, created_at, updated_at, deleted_at, deleted_by
FROM profiles
WHERE id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

INSERT INTO solicitacoes_new (
  id, assunto, protocolo, status, data_inicio, data_contato, data_finalizado,
  observacoes, responsavel, ponto_contato, user_id, created_at, updated_at,
  created_by_user_name, created_by_user_email, endereco_rua, endereco_numero,
  endereco_bairro, endereco_localidade, endereco_cep, endereco_complemento,
  latitude, longitude
)
SELECT 
  id, assunto, protocolo, status, data_inicio, data_contato, data_finalizado,
  observacoes, responsavel, ponto_contato, user_id, created_at, updated_at,
  created_by_user_name, created_by_user_email, endereco_rua, endereco_numero,
  endereco_bairro, endereco_localidade, endereco_cep, endereco_complemento,
  latitude, longitude
FROM solicitacoes
WHERE id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

INSERT INTO demandas_new (
  id, assunto, protocolo, status, data_inicio, data_contato, data_finalizado,
  observacoes, responsavel, ponto_contato, user_id, created_at, updated_at,
  created_by_user_name, created_by_user_email, endereco_rua, endereco_numero,
  endereco_bairro, endereco_localidade, endereco_cep, endereco_complemento,
  latitude, longitude
)
SELECT 
  id, assunto, protocolo, status, data_inicio, data_contato, data_finalizado,
  observacoes, responsavel, ponto_contato, user_id, created_at, updated_at,
  created_by_user_name, created_by_user_email, endereco_rua, endereco_numero,
  endereco_bairro, endereco_localidade, endereco_cep, endereco_complemento,
  latitude, longitude
FROM demandas
WHERE id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Remover tabelas antigas
DROP TABLE IF EXISTS solicitacoes;
DROP TABLE IF EXISTS demandas;
DROP TABLE IF EXISTS profiles;

-- Renomear tabelas novas
ALTER TABLE solicitacoes_new RENAME TO solicitacoes;
ALTER TABLE demandas_new RENAME TO demandas;
ALTER TABLE profiles_new RENAME TO profiles;

-- Garantir acesso público (temporariamente)
GRANT ALL ON solicitacoes TO anon;
GRANT ALL ON solicitacoes TO authenticated;
GRANT ALL ON demandas TO anon;
GRANT ALL ON demandas TO authenticated;
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO authenticated;
