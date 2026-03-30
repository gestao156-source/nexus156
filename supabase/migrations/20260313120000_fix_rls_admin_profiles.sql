-- Corrigir RLS para permitir admins lerem profiles
-- Admins devem conseguir acesso completo à tabela profiles

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_read_policy" ON profiles;

-- Criar política simplificada e correta
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can delete any profile"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Adicionar comentário explicativo
COMMENT ON POLICY "Users can view all profiles" IS 'Permite todos usuários autenticados lerem profiles. Implementado em 2026-03-13 para corrigir problema de exportação.';
COMMENT ON POLICY "Users can update own profile" IS 'Permite usuários atualizarem apenas o próprio profile.';
COMMENT ON POLICY "Admins can delete any profile" IS 'Permite apenas administradores deletarem profiles.';
