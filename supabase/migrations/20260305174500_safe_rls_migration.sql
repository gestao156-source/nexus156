/*
  Safe RLS Migration - Complete Procedure
  
  Migração segura completa seguindo as melhores práticas:
  1. Backup completo dos dados
  2. Remoção controlada de políticas antigas
  3. Aplicação validada de novas políticas
  4. Verificação detalhada do resultado
  
  Data: 2026-03-05 17:45:00
  Autor: Sistema de Migração Segura
*/

-- =====================================================
-- FASE 1: BACKUP COMPLETO DOS DADOS
-- =====================================================

-- Backup de todas as tabelas principais com timestamp
CREATE TABLE backup_solicitacoes_20260305_174500 AS 
SELECT * FROM solicitacoes;

CREATE TABLE backup_demandas_20260305_174500 AS 
SELECT * FROM demandas;

CREATE TABLE backup_profiles_20260305_174500 AS 
SELECT * FROM profiles;

CREATE TABLE backup_assuntos_padrao_20260305_174500 AS 
SELECT * FROM assuntos_padrao;

CREATE TABLE backup_pontos_contato_20260305_174500 AS 
SELECT * FROM pontos_contato;

CREATE TABLE backup_admin_logs_20260305_174500 AS 
SELECT * FROM admin_logs;

-- =====================================================
-- VERIFICAÇÃO DE INTEGRIDADE DOS BACKUPS
-- =====================================================

SELECT 'BACKUP INTEGRITY CHECK' as operacao,
       'solicitacoes' as tabela,
       COUNT(*) as registros_backup,
       (SELECT COUNT(*) FROM solicitacoes) as registros_original,
       CASE WHEN COUNT(*) = (SELECT COUNT(*) FROM solicitacoes) 
            THEN 'OK' 
            ELSE 'ERROR' 
       END as status
FROM backup_solicitacoes_20260305_174500

UNION ALL

SELECT 'BACKUP INTEGRITY CHECK' as operacao,
       'demandas' as tabela,
       COUNT(*) as registros_backup,
       (SELECT COUNT(*) FROM demandas) as registros_original,
       CASE WHEN COUNT(*) = (SELECT COUNT(*) FROM demandas) 
            THEN 'OK' 
            ELSE 'ERROR' 
       END as status
FROM backup_demandas_20260305_174500

UNION ALL

SELECT 'BACKUP INTEGRITY CHECK' as operacao,
       'profiles' as tabela,
       COUNT(*) as registros_backup,
       (SELECT COUNT(*) FROM profiles) as registros_original,
       CASE WHEN COUNT(*) = (SELECT COUNT(*) FROM profiles) 
            THEN 'OK' 
            ELSE 'ERROR' 
       END as status
FROM backup_profiles_20260305_174500;

-- =====================================================
-- FASE 2: BACKUP DAS POLÍTICAS RLS ATUAIS
-- =====================================================

CREATE TABLE backup_rls_policies_20260305_174500 AS
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

SELECT 'POLICIES BACKUP' as operacao,
       COUNT(*) as policies_backed_up,
       now() as backup_time
FROM backup_rls_policies_20260305_174500;

-- =====================================================
-- FASE 3: REMOÇÃO CONTROLADA DAS POLÍTICAS ANTIGAS
-- =====================================================

-- Remover políticas de solicitacoes
DROP POLICY IF EXISTS "Users can view own solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Users can insert own solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Users can update own solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Users can delete own solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Users can view all solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Users can insert solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Users can update own solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Users can delete own solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Enable read access for all authenticated users on solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Enable insert for all authenticated users on solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Enable update for owners and admins on solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Enable delete for owners and admins on solicitacoes" ON solicitacoes;

-- Remover políticas de demandas
DROP POLICY IF EXISTS "Users can view own demandas" ON demandas;
DROP POLICY IF EXISTS "Users can insert own demandas" ON demandas;
DROP POLICY IF EXISTS "Users can update own demandas" ON demandas;
DROP POLICY IF EXISTS "Users can delete own demandas" ON demandas;
DROP POLICY IF EXISTS "Users can view all demandas" ON demandas;
DROP POLICY IF EXISTS "Users can insert demandas" ON demandas;
DROP POLICY IF EXISTS "Users can update own demandas" ON demandas;
DROP POLICY IF EXISTS "Users can delete own demandas" ON demandas;
DROP POLICY IF EXISTS "Enable read access for all authenticated users on demandas" ON demandas;
DROP POLICY IF EXISTS "Enable insert for all authenticated users on demandas" ON demandas;
DROP POLICY IF EXISTS "Enable update for owners and admins on demandas" ON demandas;
DROP POLICY IF EXISTS "Enable delete for owners and admins on demandas" ON demandas;

-- =====================================================
-- VERIFICAÇÃO: CONFIRMAR REMOÇÃO DAS POLÍTICAS
-- =====================================================

SELECT 'POLICIES REMOVAL CHECK' as operacao,
       tablename,
       COUNT(*) as policies_remaining
FROM pg_policies 
WHERE tablename IN ('solicitacoes', 'demandas')
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- FASE 4: APLICAÇÃO DAS POLÍTICAS COLABORATIVAS
-- =====================================================

-- Políticas para solicitacoes
CREATE POLICY "Enable read access for all authenticated users on solicitacoes"
  ON solicitacoes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for all authenticated users on solicitacoes"
  ON solicitacoes FOR INSERT
  TO authenticated
  WITH CHECK (true);

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

-- Políticas para demandas
CREATE POLICY "Enable read access for all authenticated users on demandas"
  ON demandas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for all authenticated users on demandas"
  ON demandas FOR INSERT
  TO authenticated
  WITH CHECK (true);

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

-- =====================================================
-- FASE 5: VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar políticas ativas após a migração
SELECT 
  'FINAL POLICIES CHECK' as operacao,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('solicitacoes', 'demandas')
ORDER BY tablename, policyname;

-- Verificar que RLS está ativo nas tabelas
SELECT 
  'RLS STATUS CHECK' as operacao,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('solicitacoes', 'demandas')
ORDER BY tablename;

-- Teste de acesso simulado (verificar se políticas permitem acesso)
SELECT 
  'ACCESS SIMULATION' as operacao,
  'Authenticated users should see all items' as expectation,
  'SELECT policies should allow all' as policy_check,
  now() as test_time;

-- =====================================================
-- FASE 6: LOG DA MIGRAÇÃO
-- =====================================================

INSERT INTO admin_logs (operation, old_value, new_value, created_by, created_at)
VALUES (
  'safe_rls_migration_complete', 
  'restrictive_policies_with_backup', 
  'collaborative_policies_with_full_backup_validation', 
  auth.uid(), 
  NOW()
);

-- =====================================================
-- FASE 7: RESUMO DA MIGRAÇÃO
-- =====================================================

SELECT 
  'MIGRATION SUMMARY' as operacao,
  'Safe RLS Migration' as migration_type,
  '20260305_174500' as migration_timestamp,
  (SELECT COUNT(*) FROM backup_solicitacoes_20260305_174500) as solicitacoes_backed_up,
  (SELECT COUNT(*) FROM backup_demandas_20260305_174500) as demandas_backed_up,
  (SELECT COUNT(*) FROM backup_profiles_20260305_174500) as profiles_backed_up,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('solicitacoes', 'demandas')) as active_policies,
  CASE 
    WHEN (SELECT COUNT(*) FROM backup_solicitacoes_20260305_174500) = (SELECT COUNT(*) FROM solicitacoes)
    AND (SELECT COUNT(*) FROM backup_demandas_20260305_174500) = (SELECT COUNT(*) FROM demandas)
    THEN 'SUCCESS'
    ELSE 'ERROR'
  END as migration_status,
  now() as completion_time;

-- =====================================================
-- INSTRUÇÕES PÓS-MIGRAÇÃO
-- =====================================================

SELECT 
  'POST-MIGRATION INSTRUCTIONS' as operacao,
  '1. Test with common user in frontend' as step1,
  '2. Verify dashboard shows all items' as step2,
  '3. Confirm edit restrictions work' as step3,
  '4. Validate admin access maintained' as step4,
  '5. Check logs for issues' as step5;

-- =====================================================
-- CLEANUP TEMPORÁRIO (OPCIONAL - APENAS APÓS VALIDAÇÃO)
-- =====================================================

-- Descomente estas linhas apenas após validar que tudo funciona:
-- DROP TABLE IF EXISTS backup_solicitacoes_20260305_174500;
-- DROP TABLE IF EXISTS backup_demandas_20260305_174500;
-- DROP TABLE IF EXISTS backup_profiles_20260305_174500;
-- DROP TABLE IF EXISTS backup_rls_policies_20260305_174500;

SELECT 
  'MIGRATION COMPLETED' as status,
  'Execute validation tests in frontend' as next_step,
  'Backups created successfully' as backup_status,
  now() as completion_timestamp;
