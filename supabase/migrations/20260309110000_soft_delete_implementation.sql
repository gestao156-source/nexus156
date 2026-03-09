/*
  Soft Delete Implementation
  
  Implementa soft delete para usuários permitindo excluir usuários 
  sem perder as solicitações/demandas que eles criaram.
  
  Changes:
  1. Adiciona campos deleted_at e deleted_by na tabela profiles
  2. Remove CASCADE DELETE e muda para SET NULL
  3. Adiciona campos de backup do criador
*/

-- 1. Adicionar campos de soft delete na tabela profiles
ALTER TABLE profiles 
ADD COLUMN deleted_at TIMESTAMP NULL,
ADD COLUMN deleted_by UUID REFERENCES profiles(id);

-- 2. Remover CASCADE DELETE e mudar para SET NULL em solicitacoes
ALTER TABLE solicitacoes 
DROP CONSTRAINT solicitacoes_user_id_fkey;

ALTER TABLE solicitacoes 
ADD CONSTRAINT solicitacoes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 3. Remover CASCADE DELETE e mudar para SET NULL em demandas  
ALTER TABLE demandas 
DROP CONSTRAINT demandas_user_id_fkey;

ALTER TABLE demandas 
ADD CONSTRAINT demandas_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 4. Adicionar campos de backup do criador em solicitacoes
ALTER TABLE solicitacoes 
ADD COLUMN created_by_user_name TEXT,
ADD COLUMN created_by_user_email TEXT;

-- 5. Adicionar campos de backup do criador em demandas
ALTER TABLE demandas 
ADD COLUMN created_by_user_name TEXT,
ADD COLUMN created_by_user_email TEXT;

-- 6. Criar trigger para popular campos de backup automaticamente
CREATE OR REPLACE FUNCTION backup_creator_info()
RETURNS TRIGGER AS $$
BEGIN
  -- Para INSERT, backup do usuário atual
  IF TG_OP = 'INSERT' THEN
    NEW.created_by_user_name = (
      SELECT full_name FROM profiles WHERE id = NEW.user_id
    );
    NEW.created_by_user_email = (
      SELECT email FROM profiles WHERE id = NEW.user_id
    );
    RETURN NEW;
  END IF;
  
  -- Para UPDATE, se o user_id mudou, atualizar backup
  IF TG_OP = 'UPDATE' AND OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    NEW.created_by_user_name = (
      SELECT full_name FROM profiles WHERE id = NEW.user_id
    );
    NEW.created_by_user_email = (
      SELECT email FROM profiles WHERE id = NEW.user_id
    );
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Criar triggers para as tabelas
DROP TRIGGER IF EXISTS backup_solicitacoes_creator ON solicitacoes;
CREATE TRIGGER backup_solicitacoes_creator
  BEFORE INSERT OR UPDATE ON solicitacoes
  FOR EACH ROW
  EXECUTE FUNCTION backup_creator_info();

DROP TRIGGER IF EXISTS backup_demandas_creator ON demandas;
CREATE TRIGGER backup_demandas_creator
  BEFORE INSERT OR UPDATE ON demandas
  FOR EACH ROW
  EXECUTE FUNCTION backup_creator_info();

-- 8. Popular campos de backup para registros existentes
UPDATE solicitacoes 
SET 
  created_by_user_name = p.full_name,
  created_by_user_email = p.email
FROM profiles p 
WHERE solicitacoes.user_id = p.id
AND solicitacoes.created_by_user_name IS NULL;

UPDATE demandas 
SET 
  created_by_user_name = p.full_name,
  created_by_user_email = p.email
FROM profiles p 
WHERE demandas.user_id = p.id
AND demandas.created_by_user_name IS NULL;

-- 9. Atualizar RLS policies para considerar usuários deletados
-- Profiles: usuários normais só podem ver perfis não deletados
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (
    auth.uid() = id 
    AND deleted_at IS NULL
  );

-- Admins podem ver todos os perfis (incluindo deletados para auditoria)
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
      AND profiles.deleted_at IS NULL
    )
  );

-- Solicitações: usuários podem ver todos os itens (mas não de usuários deletados)
DROP POLICY IF EXISTS "Authenticated users can view items" ON solicitacoes;
CREATE POLICY "Authenticated users can view items" ON solicitacoes
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND (
      user_id IS NULL 
      OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = solicitacoes.user_id 
        AND profiles.deleted_at IS NULL
      )
    )
  );

-- Demandas: usuários podem ver todos os itens (mas não de usuários deletados)
DROP POLICY IF EXISTS "Authenticated users can view items" ON demandas;
CREATE POLICY "Authenticated users can view items" ON demandas
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND (
      user_id IS NULL 
      OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = demandas.user_id 
        AND profiles.deleted_at IS NULL
      )
    )
  );

-- 10. Criar índices para performance
CREATE INDEX idx_profiles_deleted_at ON profiles(deleted_at);
CREATE INDEX idx_solicitacoes_user_id_null ON solicitacoes(user_id) WHERE user_id IS NULL;
CREATE INDEX idx_demandas_user_id_null ON demandas(user_id) WHERE user_id IS NULL;
