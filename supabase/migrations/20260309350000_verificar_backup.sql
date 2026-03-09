/*
  Verificação e Criação de Backup Manual
  
  Verifica se backup existe e cria se necessário
*/

-- Verificar se backup existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'solicitacoes_backup_pre_endereco') THEN
        -- Criar backup se não existir
        CREATE TABLE solicitacoes_backup_pre_endereco AS TABLE solicitacoes;
        CREATE TABLE demandas_backup_pre_endereco AS TABLE demandas;
        CREATE TABLE profiles_backup_pre_endereco AS TABLE profiles;
        
        RAISE LOG 'BACKUP CRIADO MANUALMENTE EM %', now();
    ELSE
        RAISE LOG 'BACKUP JÁ EXISTE - VERIFICADO EM %', now();
    END IF;
END $$;

-- Verificar contagem atual
DO $$
DECLARE
    sol_count INTEGER;
    dem_count INTEGER;
    prof_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO sol_count FROM solicitacoes;
    SELECT COUNT(*) INTO dem_count FROM demandas;
    SELECT COUNT(*) INTO prof_count FROM profiles;
    
    RAISE LOG '=== VERIFICAÇÃO DE DADOS ATUAIS ===', now();
    RAISE LOG 'Solicitacoes: % registros', sol_count;
    RAISE LOG 'Demandas: % registros', dem_count;
    RAISE LOG 'Profiles: % registros', prof_count;
    RAISE LOG '================================';
END;
$$ LANGUAGE plpgsql;
