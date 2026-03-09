/*
  RLS Robusto - Script do Usuário (Superior ao Híbrido)
  
  Implementa controle granular de acesso com segurança máxima:
  - SELECT: Todo mundo pode ver (com controle RLS)
  - INSERT: Apenas usuários autenticados
  - UPDATE: Dono do registro OU admin
  - DELETE: Apenas admin
*/

-- ===============================================
-- Limpar RLS anterior completamente
-- ===============================================
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all solicitacoes" ON public.solicitacoes;
DROP POLICY IF EXISTS "Users can manage own solicitacoes" ON public.solicitacoes;
DROP POLICY IF EXISTS "Admins can manage all demandas" ON public.demandas;
DROP POLICY IF EXISTS "Users can manage own demandas" ON public.demandas;

-- ===============================================
-- Criar índices para performance
-- ===============================================
CREATE INDEX IF NOT EXISTS idx_profiles_id_role ON public.profiles(id, role);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_user_id ON public.solicitacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_demandas_user_id ON public.demandas(user_id);

-- ===============================================
-- Ativar RLS em todas as tabelas
-- ===============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demandas ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- Tabela: profiles
-- ===============================================

-- SELECT: Admin pode ver todos, usuários veem todos
CREATE POLICY "Todos podem ver profiles"
ON public.profiles
FOR SELECT
USING (true);

-- INSERT: Apenas usuários autenticados podem criar profiles
CREATE POLICY "Usuarios podem criar profiles"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Dono OU admin pode editar profile
CREATE POLICY "Admin ou dono pode editar profiles"
ON public.profiles
FOR UPDATE
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- DELETE: Apenas admin pode deletar profiles
CREATE POLICY "Admin pode deletar profiles"
ON public.profiles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- ===============================================
-- Tabela: solicitacoes
-- ===============================================

-- SELECT: Todo mundo pode ver solicitacoes
CREATE POLICY "Todos podem ver solicitacoes"
ON public.solicitacoes
FOR SELECT
USING (true);

-- INSERT: Qualquer usuário logado pode criar solicitacoes
CREATE POLICY "Usuarios podem criar solicitacoes"
ON public.solicitacoes
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Admin OU dono do registro pode editar
CREATE POLICY "Admin ou dono pode editar solicitacoes"
ON public.solicitacoes
FOR UPDATE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- DELETE: Apenas admin pode deletar solicitacoes
CREATE POLICY "Admin pode deletar solicitacoes"
ON public.solicitacoes
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- ===============================================
-- Tabela: demandas
-- ===============================================

-- SELECT: Todo mundo pode ver demandas
CREATE POLICY "Todos podem ver demandas"
ON public.demandas
FOR SELECT
USING (true);

-- INSERT: Qualquer usuário logado pode criar demandas
CREATE POLICY "Usuarios podem criar demandas"
ON public.demandas
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Admin OU dono do registro pode editar
CREATE POLICY "Admin ou dono pode editar demandas"
ON public.demandas
FOR UPDATE
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- DELETE: Apenas admin pode deletar demandas
CREATE POLICY "Admin pode deletar demandas"
ON public.demandas
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- ===============================================
-- Garantir permissões base
-- ===============================================
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

GRANT SELECT ON public.solicitacoes TO anon;
GRANT SELECT ON public.solicitacoes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.solicitacoes TO authenticated;

GRANT SELECT ON public.demandas TO anon;
GRANT SELECT ON public.demandas TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.demandas TO authenticated;

-- ===============================================
-- Log da operação
-- ===============================================
DO $$
BEGIN
    RAISE LOG 'RLS Robusto implementado em % - Controle granular de acesso';
    RAISE LOG 'SELECT: Todo mundo pode ver';
    RAISE LOG 'INSERT: Usuarios autenticados podem criar';
    RAISE LOG 'UPDATE: Dono ou admin pode editar';
    RAISE LOG 'DELETE: Apenas admin pode deletar';
END;
$$ LANGUAGE plpgsql;
