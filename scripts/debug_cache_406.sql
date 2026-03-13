-- Script para verificar se as políticas foram aplicadas corretamente
-- e diagnosticar problemas de cache/requisição

-- 1. Verificar se as políticas foram criadas corretamente
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    RAISE NOTICE '=== VERIFICAÇÃO DE POLÍTICAS RLS ===';
    
    -- Verificar políticas de solicitacoes
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'solicitacoes';
    
    RAISE NOTICE 'Políticas encontradas para solicitacoes: %', policy_count;
    
    IF policy_count > 0 THEN
        RAISE NOTICE 'Políticas:';
        FOR policy IN 
            SELECT policyname, cmd, roles, permissive, qual 
            FROM pg_policies 
            WHERE tablename = 'solicitacoes'
        LOOP
            RAISE NOTICE '  - % (%) para %', policy.policyname, policy.cmd, policy.roles;
        END LOOP;
    ELSE
        RAISE NOTICE '❌ Nenhuma política encontrada para solicitacoes!';
    END IF;
    
    -- Verificar políticas de demandas
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'demandas';
    
    RAISE NOTICE 'Políticas encontradas para demandas: %', policy_count;
    
    IF policy_count > 0 THEN
        RAISE NOTICE 'Políticas:';
        FOR policy IN 
            SELECT policyname, cmd, roles, permissive, qual 
            FROM pg_policies 
            WHERE tablename = 'demandas'
        LOOP
            RAISE NOTICE '  - % (%) para %', policy.policyname, policy.cmd, policy.roles;
        END LOOP;
    ELSE
        RAISE NOTICE '❌ Nenhuma política encontrada para demandas!';
    END IF;
    
    RAISE NOTICE '=================================';
END $$;

-- 2. Verificar se RLS está ativo
DO $$
DECLARE
    rls_enabled BOOLEAN;
BEGIN
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class 
    WHERE relname = 'solicitacoes';
    
    RAISE NOTICE 'RLS status para solicitacoes: %', rls_enabled;
    
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class 
    WHERE relname = 'demandas';
    
    RAISE NOTICE 'RLS status para demandas: %', rls_enabled;
END $$;

-- 3. Testar acesso direto à tabela (simulando requisição)
DO $$
DECLARE
    test_count INTEGER;
    test_record RECORD;
BEGIN
    RAISE NOTICE '=== TESTE DE ACESSO DIRETO ===';
    
    -- Testar SELECT simples
    BEGIN
        SELECT COUNT(*) INTO test_count FROM solicitacoes;
        RAISE NOTICE '✅ SELECT COUNT(*) de solicitacoes: % registros', test_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro no SELECT COUNT: %', SQLERRM;
    END;
    
    -- Testar SELECT com ID específico
    BEGIN
        SELECT * INTO test_record FROM solicitacoes WHERE id = '4ce5a352-f00e-463f-bf46-189bcb2bb211';
        IF FOUND THEN
            RAISE NOTICE '✅ Registro específico encontrado: %', test_record.assunto;
        ELSE
            RAISE NOTICE '❌ Registro específico NÃO encontrado';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao buscar registro específico: %', SQLERRM;
    END;
    
    RAISE NOTICE '==========================';
END $$;

-- 4. Verificar permissões do usuário
DO $$
DECLARE
    grant_count INTEGER;
BEGIN
    RAISE NOTICE '=== VERIFICAÇÃO DE PERMISSÕES ===';
    
    -- Verificar permissões para authenticated
    SELECT COUNT(*) INTO grant_count
    FROM information_schema.role_table_grants 
    WHERE table_name = 'solicitacoes' 
    AND grantee = 'authenticated'
    AND privilege_type = 'SELECT';
    
    RAISE NOTICE 'Permissões SELECT para authenticated em solicitacoes: %', grant_count;
    
    -- Verificar permissões para anon
    SELECT COUNT(*) INTO grant_count
    FROM information_schema.role_table_grants 
    WHERE table_name = 'solicitacoes' 
    AND grantee = 'anon'
    AND privilege_type = 'SELECT';
    
    RAISE NOTICE 'Permissões SELECT para anon em solicitacoes: %', grant_count;
    
    RAISE NOTICE '==============================';
END $$;

-- 5. Sugerir solução final
DO $$
BEGIN
    RAISE NOTICE '=== SUGESTÕES PARA O ERRO 406 ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Se os dados estão sendo retornados (como visto no console),';
    RAISE NOTICE 'mas o erro 406 ainda aparece, pode ser:';
    RAISE NOTICE '';
    RAISE NOTICE '1. Cache do navegador - Limpar cache e recarregar';
    RAISE NOTICE '2. Múltiplas requisições simultâneas';
    RAISE NOTICE '3. Headers HTTP incorretos';
    RAISE NOTICE '4. Problema com Accept headers';
    RAISE NOTICE '';
    RAISE NOTICE 'Soluções recomendadas:';
    RAISE NOTICE '- Limpar cache do navegador';
    RAISE NOTICE '- Recarregar a página (Ctrl+F5)';
    RAISE NOTICE '- Verificar Network tab para ver todas as requisições';
    RAISE NOTICE '================================';
END $$;
