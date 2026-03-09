/*
  Limpeza Completa de RLS - Preparar para RLS Híbrido
  
  Remove todas as políticas RLS problemáticas e prepara o banco
  para implementação de RLS híbrido (leitura aberta, escrita protegida).
*/

-- 1. Remover TODAS as políticas RLS existentes
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable authenticated access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable delete own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own solicitacoes" ON public.solicitacoes;
DROP POLICY IF EXISTS "Users can insert own solicitacoes" ON public.solicitacoes;
DROP POLICY IF EXISTS "Users can update own solicitacoes" ON public.solicitacoes;
DROP POLICY IF EXISTS "Users can delete own solicitacoes" ON public.solicitacoes;
DROP POLICY IF EXISTS "Authenticated users can view items" ON public.solicitacoes;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.solicitacoes;
DROP POLICY IF EXISTS "Enable authenticated access to solicitacoes" ON public.solicitacoes;
DROP POLICY IF EXISTS "Enable insert own solicitacoes" ON public.solicitacoes;
DROP POLICY IF EXISTS "Enable update own solicitacoes" ON public.solicitacoes;
DROP POLICY IF EXISTS "Enable delete own solicitacoes" ON public.solicitacoes;
DROP POLICY IF EXISTS "Users can insert own solicitacoes" ON public.solicitacoes;
DROP POLICY IF EXISTS "Users can insert own demandas" ON public.demandas;

DROP POLICY IF EXISTS "Users can view own demandas" ON public.demandas;
DROP POLICY IF EXISTS "Users can insert own demandas" ON public.demandas;
DROP POLICY IF EXISTS "Users can update own demandas" ON public.demandas;
DROP POLICY IF EXISTS "Users can delete own demandas" ON public.demandas;
DROP POLICY IF EXISTS "Authenticated users can view items" ON public.demandas;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.demandas;
DROP POLICY IF EXISTS "Enable authenticated access to demandas" ON public.demandas;
DROP POLICY IF EXISTS "Enable insert own demandas" ON public.demandas;
DROP POLICY IF EXISTS "Enable update own demandas" ON public.demandas;
DROP POLICY IF EXISTS "Enable delete own demandas" ON public.demandas;

-- 2. Remover triggers problemáticos
DROP TRIGGER IF EXISTS validate_solicitacoes_coordinates ON public.solicitacoes;
DROP TRIGGER IF EXISTS validate_demandas_coordinates ON public.demandas;
DROP TRIGGER IF EXISTS auth_profiles_insert ON public.profiles;
DROP TRIGGER IF EXISTS auth_profiles_update ON public.profiles;
DROP TRIGGER IF EXISTS auth_profiles_delete ON public.profiles;

-- 3. Remover funções que podem causar problemas
DROP FUNCTION IF EXISTS validate_coordinates();
DROP FUNCTION IF EXISTS validate_endereco_coordinates();
DROP FUNCTION IF EXISTS format_endereco_completo();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_user_update();
DROP FUNCTION IF EXISTS public.handle_user_delete();

-- 4. Remover views que podem ter referências quebradas
DROP VIEW IF EXISTS public.solicitacoes_com_endereco;
DROP VIEW IF EXISTS public.demandas_com_endereco;
DROP VIEW IF EXISTS public.users_view;
DROP VIEW IF EXISTS public.user_stats;

-- 5. Desabilitar RLS completamente temporariamente
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.demandas DISABLE ROW LEVEL SECURITY;

-- 6. Garantir acesso básico para teste
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.solicitacoes TO anon;
GRANT SELECT ON public.solicitacoes TO authenticated;
GRANT SELECT ON public.demandas TO anon;
GRANT SELECT ON public.demandas TO authenticated;

-- 7. Limpar permissões de escrita temporariamente
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.solicitacoes FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.solicitacoes FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.demandas FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.demandas FROM authenticated;

-- 8. Log da operação
DO $$
BEGIN
    RAISE LOG 'RLS completamente limpo em % - Preparado para RLS Híbrido';
END;
$$ LANGUAGE plpgsql;
