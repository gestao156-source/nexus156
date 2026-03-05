-- ========================================
-- BACKUP COMPLETO ANTES DAS MIGRAÇÕES
-- Data: 2026-03-05
-- ========================================

-- Criar tabelas de backup
CREATE TABLE backup_profiles_20260305 AS SELECT * FROM profiles;
CREATE TABLE backup_solicitacoes_20260305 AS SELECT * FROM solicitacoes; 
CREATE TABLE backup_demandas_20260305 AS SELECT * FROM demandas;
CREATE TABLE backup_assuntos_padrao_20260305 AS SELECT * FROM assuntos_padrao;
CREATE TABLE backup_pontos_contato_20260305 AS SELECT * FROM pontos_contato;

-- Verificar backup com contagem
SELECT 'profiles' as tabela, COUNT(*) as total FROM backup_profiles_20260305
UNION ALL
SELECT 'solicitacoes' as tabela, COUNT(*) as total FROM backup_solicitacoes_20260305
UNION ALL  
SELECT 'demandas' as tabela, COUNT(*) as total FROM backup_demandas_20260305
UNION ALL
SELECT 'assuntos_padrao' as tabela, COUNT(*) as total FROM backup_assuntos_padrao_20260305
UNION ALL
SELECT 'pontos_contato' as tabela, COUNT(*) as total FROM backup_pontos_contato_20260305;

-- ========================================
-- ROLLBACK (se necessário)
-- ========================================

-- Para restaurar o backup, execute:
/*
DROP TABLE profiles;
DROP TABLE solicitacoes; 
DROP TABLE demandas;
DROP TABLE assuntos_padrao;
DROP TABLE pontos_contato;

CREATE TABLE profiles AS SELECT * FROM backup_profiles_20260305;
CREATE TABLE solicitacoes AS SELECT * FROM backup_solicitacoes_20260305;
CREATE TABLE demandas AS SELECT * FROM backup_demandas_20260305;
CREATE TABLE assuntos_padrao AS SELECT * FROM backup_assuntos_padrao_20260305;
CREATE TABLE pontos_contato AS SELECT * FROM backup_pontos_contato_20260305;
*/
