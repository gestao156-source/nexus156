/*
  RLS Híbrido - Leitura Aberta, Escrita Protegida
  
  Implementa RLS híbrido onde:
  - SELECT: Acesso aberto (sem RLS para leitura)
  - INSERT/UPDATE/DELETE: RLS ativo com regras de negócio
*/

-- 1. Habilitar RLS nas tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demandas ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para tabela profiles (apenas escrita)
-- Admins podem gerenciar todos os profiles
CREATE POLICY "Admins can manage all profiles" ON public.profiles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Usuários podem gerenciar apenas seu próprio profile
CREATE POLICY "Users can manage own profile" ON public.profiles
FOR ALL USING (id = auth.uid());

-- 3. Políticas para tabela solicitacoes (apenas escrita)
-- Admins podem gerenciar todas as solicitacoes
CREATE POLICY "Admins can manage all solicitacoes" ON public.solicitacoes
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Usuários podem gerenciar apenas suas solicitacoes
CREATE POLICY "Users can manage own solicitacoes" ON public.solicitacoes
FOR ALL USING (user_id = auth.uid());

-- 4. Políticas para tabela demandas (apenas escrita)
-- Admins podem gerenciar todas as demandas
CREATE POLICY "Admins can manage all demandas" ON public.demandas
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Usuários podem gerenciar apenas suas demandas
CREATE POLICY "Users can manage own demandas" ON public.demandas
FOR ALL USING (user_id = auth.uid());

-- 5. Garantir permissões (leitura aberta para todos)
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.solicitacoes TO anon;
GRANT SELECT ON public.solicitacoes TO authenticated;
GRANT SELECT ON public.demandas TO anon;
GRANT SELECT ON public.demandas TO authenticated;

-- 6. Permissões de escrita apenas para autenticados
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.solicitacoes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.demandas TO authenticated;

-- 7. Log da operação
DO $$
BEGIN
    RAISE LOG 'RLS Híbrido implementado em % - Leitura aberta, escrita protegida';
END;
$$ LANGUAGE plpgsql;
