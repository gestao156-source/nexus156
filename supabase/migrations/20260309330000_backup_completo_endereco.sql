/*
  Backup Completo - Antes de Implementar Endereço e Georeferenciamento
  
  Cria backup completo de todas as tabelas e políticas RLS
  para garantir rollback completo se necessário.
*/

-- 1. Backup das tabelas principais
CREATE TABLE solicitacoes_backup_pre_endereco AS TABLE solicitacoes;
CREATE TABLE demandas_backup_pre_endereco AS TABLE demandas;
CREATE TABLE profiles_backup_pre_endereco AS TABLE profiles;

-- 2. Backup das políticas RLS
CREATE TABLE rls_policies_backup_pre_endereco AS 
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
WHERE schemaname = 'public';

-- 3. Backup do schema das tabelas
CREATE TABLE schema_backup_pre_endereco AS
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('solicitacoes', 'demandas', 'profiles')
ORDER BY table_name, ordinal_position;

-- 4. Contagem de registros para verificação
DO $$
DECLARE
    sol_count INTEGER;
    dem_count INTEGER;
    prof_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO sol_count FROM solicitacoes_backup_pre_endereco;
    SELECT COUNT(*) INTO dem_count FROM demandas_backup_pre_endereco;
    SELECT COUNT(*) INTO prof_count FROM profiles_backup_pre_endereco;
    
    RAISE LOG '=== BACKUP COMPLETO CRIADO EM % ===', now();
    RAISE LOG 'Solicitacoes: % registros', sol_count;
    RAISE LOG 'Demandas: % registros', dem_count;
    RAISE LOG 'Profiles: % registros', prof_count;
    RAISE LOG '====================================';
END;
$$ LANGUAGE plpgsql;
