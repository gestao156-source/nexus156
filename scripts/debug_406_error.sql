-- Script para diagnosticar erro 406 nas requisições do Supabase
-- O erro 406 (Not Acceptable) geralmente ocorre quando há problemas de permissão RLS

-- 1. Verificar se RLS está ativo nas tabelas
DO $$
DECLARE
    rls_solicitacoes BOOLEAN;
    rls_demandas BOOLEAN;
BEGIN
    SELECT relrowsecurity INTO rls_solicitacoes 
    FROM pg_class 
    WHERE relname = 'solicitacoes';
    
    SELECT relrowsecurity INTO rls_demandas 
    FROM pg_class 
    WHERE relname = 'demandas';
    
    RAISE NOTICE '🔒 RLS Status:';
    RAISE NOTICE '   solicitacoes: %', rls_solicitacoes;
    RAISE NOTICE '   demandas: %', rls_demandas;
END $$;

-- 2. Verificar políticas existentes para solicitacoes
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'solicitacoes';
    
    RAISE NOTICE '📋 Políticas para solicitacoes: %', policy_count;
    
    IF policy_count > 0 THEN
        RAISE NOTICE 'Políticas encontradas:';
        FOR policy IN 
            SELECT policyname, cmd, roles 
            FROM pg_policies 
            WHERE tablename = 'solicitacoes'
        LOOP
            RAISE NOTICE '  - % (%) para %', policy.policyname, policy.cmd, policy.roles;
        END LOOP;
    END IF;
END $$;

-- 3. Verificar políticas existentes para demandas
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'demandas';
    
    RAISE NOTICE '📋 Políticas para demandas: %', policy_count;
    
    IF policy_count > 0 THEN
        RAISE NOTICE 'Políticas encontradas:';
        FOR policy IN 
            SELECT policyname, cmd, roles 
            FROM pg_policies 
            WHERE tablename = 'demandas'
        LOOP
            RAISE NOTICE '  - % (%) para %', policy.policyname, policy.cmd, policy.roles;
        END LOOP;
    END IF;
END $$;

-- 4. Verificar estrutura da tabela solicitacoes
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Verificar se a coluna observacoes existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'solicitacoes' 
        AND column_name = 'observacoes'
    ) INTO column_exists;
    
    RAISE NOTICE '🔍 Coluna observacoes em solicitacoes: %', column_exists;
    
    -- Listar todas as colunas
    RAISE NOTICE '📋 Colunas da tabela solicitacoes:';
    FOR col IN 
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'solicitacoes'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - % (%) %', col.column_name, col.data_type, col.is_nullable;
    END LOOP;
END $$;

-- 5. Testar query simples (sem autenticação)
DO $$
DECLARE
    test_count INTEGER;
BEGIN
    -- Testar SELECT direto
    BEGIN
        SELECT COUNT(*) INTO test_count FROM solicitacoes;
        RAISE NOTICE '📊 Total de solicitacoes (sem RLS): %', test_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao acessar solicitacoes: %', SQLERRM;
    END;
    
    -- Testar com ID específico
    BEGIN
        SELECT COUNT(*) INTO test_count FROM solicitacoes WHERE id = '4ce5a352-f00e-463f-bf46-189bcb2bb211';
        RAISE NOTICE '📊 Solicitação específica encontrada: %', test_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao buscar solicitação específica: %', SQLERRM;
    END;
END $$;

-- 6. Verificar permissões do usuário anon/authenticated
DO $$
DECLARE
    grant_count INTEGER;
BEGIN
    RAISE NOTICE '👥 Permissões para usuários anon:';
    FOR grant_rec IN 
        SELECT grantee, privilege_type 
        FROM information_schema.role_table_grants 
        WHERE table_name = 'solicitacoes' 
        AND grantee = 'anon'
    LOOP
        RAISE NOTICE '  - %: %', grant_rec.grantee, grant_rec.privilege_type;
    END LOOP;
    
    RAISE NOTICE '👥 Permissões para usuários authenticated:';
    FOR grant_rec IN 
        SELECT grantee, privilege_type 
        FROM information_schema.role_table_grants 
        WHERE table_name = 'solicitacoes' 
        AND grantee = 'authenticated'
    LOOP
        RAISE NOTICE '  - %: %', grant_rec.grantee, grant_rec.privilege_type;
    END LOOP;
END $$;

-- 7. Sugerir correção se necessário
DO $$
BEGIN
    RAISE NOTICE '🔧 Sugestões de correção:';
    RAISE NOTICE '1. Verificar se há conflito entre políticas RLS';
    RAISE NOTICE '2. Garantir que políticas SELECT permitam acesso';
    RAISE NOTICE '3. Verificar se a coluna observacoes existe e está acessível';
    RAISE NOTICE '4. Testar com usuário autenticado vs anon';
    RAISE NOTICE '5. Considerar simplificar políticas RLS se necessário';
END $$;
