/*
  Fix RLS Policies - Definitive Solution
  
  Migração definitiva para corrigir o problema de permissões.
  Remove TODAS as políticas existentes e recria apenas as colaborativas.
  
  Problema: Políticas antigas restritivas ainda estavam ativas
  Solução: Limpar tudo e recriar do zero com políticas colaborativas
*/

-- Backup das políticas atuais (para auditoria)
CREATE TEMP TABLE backup_policies AS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check,
  now() as backup_time
FROM pg_policies 
WHERE tablename IN ('solicitacoes', 'demandas', 'profiles');

-- REMOVER TODAS AS POLÍTICAS EXISTENTES
-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Solicitacoes - REMOVER TUDO
DROP POLICY IF EXISTS "Users can view own solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Users can insert own solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Users can update own solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Users can delete own solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Users can view all solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Users can insert solicitacoes" ON solicitacoes;

-- Demandas - REMOVER TUDO
DROP POLICY IF EXISTS "Users can view own demandas" ON demandas;
DROP POLICY IF EXISTS "Users can insert own demandas" ON demandas;
DROP POLICY IF EXISTS "Users can update own demandas" ON demandas;
DROP POLICY IF EXISTS "Users can delete own demandas" ON demandas;
DROP POLICY IF EXISTS "Users can view all demandas" ON demandas;
DROP POLICY IF EXISTS "Users can insert demandas" ON demandas;

-- RECREAR APENAS POLÍTICAS COLABORATIVAS

-- Profiles: Manter acesso individual para perfis
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Solicitacoes: Políticas Colaborativas
-- 1. SELECT: Todos podem ver
CREATE POLICY "Enable read access for all authenticated users on solicitacoes"
  ON solicitacoes FOR SELECT
  TO authenticated
  USING (true);

-- 2. INSERT: Todos podem criar
CREATE POLICY "Enable insert for all authenticated users on solicitacoes"
  ON solicitacoes FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 3. UPDATE: Donos ou admins
CREATE POLICY "Enable update for owners and admins on solicitacoes"
  ON solicitacoes FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 4. DELETE: Donos ou admins
CREATE POLICY "Enable delete for owners and admins on solicitacoes"
  ON solicitacoes FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Demandas: Políticas Colaborativas
-- 1. SELECT: Todos podem ver
CREATE POLICY "Enable read access for all authenticated users on demandas"
  ON demandas FOR SELECT
  TO authenticated
  USING (true);

-- 2. INSERT: Todos podem criar
CREATE POLICY "Enable insert for all authenticated users on demandas"
  ON demandas FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 3. UPDATE: Donos ou admins
CREATE POLICY "Enable update for owners and admins on demandas"
  ON demandas FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 4. DELETE: Donos ou admins
CREATE POLICY "Enable delete for owners and admins on demandas"
  ON demandas FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- VERIFICAÇÃO FINAL
-- Verificar políticas ativas após a migração
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('solicitacoes', 'demandas', 'profiles')
ORDER BY tablename, policyname;

-- Verificar se RLS está ativo nas tabelas
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('solicitacoes', 'demandas', 'profiles')
ORDER BY tablename;

-- Log da migração definitiva
INSERT INTO admin_logs (operation, old_value, new_value, created_by, created_at)
VALUES (
  'rls_policy_definitive_fix', 
  'mixed_restrictive_policies', 
  'collaborative_only_policies', 
  auth.uid(), 
  NOW()
);

-- Estatísticas da migração
SELECT 
  'Migration Complete' as status,
  COUNT(*) as total_policies,
  NOW() as completed_at
FROM pg_policies 
WHERE tablename IN ('solicitacoes', 'demandas', 'profiles');
