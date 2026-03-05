/*
  Complete Rollback Script
  
  Script de emergência para restaurar o sistema ao estado original
  Data: 2026-03-05 18:00:00
  Uso: Apenas em caso de falha crítica na migração segura
  
  Este script restaura:
  1. Dados originais dos backups
  2. Políticas RLS restritivas originais
  3. Remove todas as alterações da migração segura
*/

-- =====================================================
-- VERIFICAÇÃO PRÉ-ROLLBACK
-- =====================================================

-- Verificar se os backups existem
SELECT 
  'BACKUP VERIFICATION' as operacao,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backup_solicitacoes_20260305_174500')
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backup_demandas_20260305_174500')
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'backup_profiles_20260305_174500')
    THEN 'BACKUPS_EXIST'
    ELSE 'NO_BACKUPS_FOUND'
  END as status;

-- Contagem de dados atuais vs backup
SELECT 
  'CURRENT vs BACKUP' as operacao,
  'solicitacoes' as tabela,
  (SELECT COUNT(*) FROM solicitacoes) as atual,
  (SELECT COUNT(*) FROM backup_solicitacoes_20260305_174500) as backup,
  CASE 
    WHEN (SELECT COUNT(*) FROM solicitacoes) = (SELECT COUNT(*) FROM backup_solicitacoes_20260305_174500)
    THEN 'IGUAL'
    ELSE 'DIFERENTE'
  END as status

UNION ALL

SELECT 
  'CURRENT vs BACKUP' as operacao,
  'demandas' as tabela,
  (SELECT COUNT(*) FROM demandas) as atual,
  (SELECT COUNT(*) FROM backup_demandas_20260305_174500) as backup,
  CASE 
    WHEN (SELECT COUNT(*) FROM demandas) = (SELECT COUNT(*) FROM backup_demandas_20260305_174500)
    THEN 'IGUAL'
    ELSE 'DIFERENTE'
  END as status;

-- =====================================================
-- ROLLBACK COMPLETO
-- =====================================================

-- 1. Remover todas as políticas atuais (da migração segura)
DROP POLICY IF EXISTS "Enable read access for all authenticated users on solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Enable insert for all authenticated users on solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Enable update for owners and admins on solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Enable delete for owners and admins on solicitacoes" ON solicitacoes;

DROP POLICY IF EXISTS "Enable read access for all authenticated users on demandas" ON demandas;
DROP POLICY IF EXISTS "Enable insert for all authenticated users on demandas" ON demandas;
DROP POLICY IF EXISTS "Enable update for owners and admins on demandas" ON demandas;
DROP POLICY IF EXISTS "Enable delete for owners and admins on demandas" ON demandas;

-- 2. Restaurar dados dos backups
DROP TABLE IF EXISTS solicitacoes;
CREATE TABLE solicitacoes AS SELECT * FROM backup_solicitacoes_20260305_174500;

DROP TABLE IF EXISTS demandas;
CREATE TABLE demandas AS SELECT * FROM backup_demandas_20260305_174500;

DROP TABLE IF EXISTS profiles;
CREATE TABLE profiles AS SELECT * FROM backup_profiles_20260305_174500;

DROP TABLE IF EXISTS assuntos_padrao;
CREATE TABLE assuntos_padrao AS SELECT * FROM backup_assuntos_padrao_20260305_174500;

DROP TABLE IF EXISTS pontos_contato;
CREATE TABLE pontos_contato AS SELECT * FROM backup_pontos_contato_20260305_174500;

DROP TABLE IF EXISTS admin_logs;
CREATE TABLE admin_logs AS SELECT * FROM backup_admin_logs_20260305_174500;

-- 3. Restaurar políticas originais (restritivas)
CREATE POLICY "Users can view own solicitacoes"
  ON solicitacoes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own solicitacoes"
  ON solicitacoes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own solicitacoes"
  ON solicitacoes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own solicitacoes"
  ON solicitacoes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view own demandas"
  ON demandas FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own demandas"
  ON demandas FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own demandas"
  ON demandas FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own demandas"
  ON demandas FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- VERIFICAÇÃO PÓS-ROLLBACK
-- =====================================================

-- Verificar dados restaurados
SELECT 
  'DATA RESTORED' as operacao,
  'solicitacoes' as tabela,
  COUNT(*) as registros
FROM solicitacoes

UNION ALL

SELECT 
  'DATA RESTORED' as operacao,
  'demandas' as tabela,
  COUNT(*) as registros
FROM demandas

UNION ALL

SELECT 
  'DATA RESTORED' as operacao,
  'profiles' as tabela,
  COUNT(*) as registros
FROM profiles;

-- Verificar políticas restauradas
SELECT 
  'POLICIES RESTORED' as operacao,
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

-- Verificar que RLS está ativo
SELECT 
  'RLS STATUS CHECK' as operacao,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('solicitacoes', 'demandas', 'profiles')
ORDER BY tablename;

-- =====================================================
-- LOG DO ROLLBACK
-- =====================================================

INSERT INTO admin_logs (operation, old_value, new_value, created_by, created_at)
VALUES (
  'complete_rollback', 
  'collaborative_policies_with_backup', 
  'original_restrictive_policies_restored', 
  auth.uid(), 
  NOW()
);

-- =====================================================
-- RESUMO DO ROLLBACK
-- =====================================================

SELECT 
  'ROLLBACK SUMMARY' as operacao,
  'Complete System Rollback' as rollback_type,
  '20260305_180000' as rollback_timestamp,
  (SELECT COUNT(*) FROM solicitacoes) as solicitacoes_restored,
  (SELECT COUNT(*) FROM demandas) as demandas_restored,
  (SELECT COUNT(*) FROM profiles) as profiles_restored,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename IN ('solicitacoes', 'demandas')) as active_policies,
  'System restored to original state' as rollback_status,
  now() as completion_time;

-- =====================================================
-- INSTRUÇÕES PÓS-ROLLBACK
-- =====================================================

SELECT 
  'POST-ROLLBACK INSTRUCTIONS' as operacao,
  '1. Verify user access in frontend' as step1,
  '2. Test common user sees only own items' as step2,
  '3. Confirm admin access works' as step3,
  '4. Check dashboard shows correct data' as step4,
  '5. Validate all functionality' as step5;

-- =====================================================
-- LIMPEZA DOS BACKUPS (OPCIONAL)
-- =====================================================

-- ATENÇÃO: Descomente apenas após confirmar que tudo funciona
/*
DROP TABLE IF EXISTS backup_solicitacoes_20260305_174500;
DROP TABLE IF EXISTS backup_demandas_20260305_174500;
DROP TABLE IF EXISTS backup_profiles_20260305_174500;
DROP TABLE IF EXISTS backup_assuntos_padrao_20260305_174500;
DROP TABLE IF EXISTS backup_pontos_contato_20260305_174500;
DROP TABLE IF EXISTS backup_admin_logs_20260305_174500;
DROP TABLE IF EXISTS backup_rls_policies_20260305_174500;
*/

SELECT 
  'ROLLBACK COMPLETED' as status,
  'System restored to original state' as message,
  'Test all user functionalities' as next_step,
  'Backups preserved for safety' as backup_status,
  now() as completion_timestamp;
