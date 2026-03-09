/*
  Reset Nuclear Completo - Última Recurso
  
  Remove ABSOLUTAMENTE TUDO do banco e recria do zero.
  Funções, triggers, views, políticas, tabelas - TUDO.
  Esta é a última opção antes de recriar o projeto.
*/

-- 1. Remover TODAS as views
DROP VIEW IF EXISTS public.solicitacoes_com_endereco CASCADE;
DROP VIEW IF EXISTS public.demandas_com_endereco CASCADE;
DROP VIEW IF EXISTS public.active_profiles CASCADE;
DROP VIEW IF EXISTS public.deleted_profiles CASCADE;

-- 2. Remover TODAS as funções
DROP FUNCTION IF EXISTS public.backup_creator_info() CASCADE;
DROP FUNCTION IF EXISTS public.validate_coordinates() CASCADE;
DROP FUNCTION IF EXISTS public.validate_endereco_coordinates() CASCADE;
DROP FUNCTION IF EXISTS public.format_endereco_completo() CASCADE;
DROP FUNCTION IF EXISTS public.add_business_days() CASCADE;
DROP FUNCTION IF EXISTS public.set_prazo_by_status() CASCADE;
DROP FUNCTION IF EXISTS public.simple_backup_creator() CASCADE;

-- 3. Remover TODOS os triggers
DROP TRIGGER IF EXISTS public.backup_solicitacoes_creator CASCADE;
DROP TRIGGER IF EXISTS public.backup_demandas_creator CASCADE;
DROP TRIGGER IF EXISTS public.simple_backup_solicitacoes CASCADE;
DROP TRIGGER IF EXISTS public.simple_backup_demandas CASCADE;
DROP TRIGGER IF EXISTS public.backup_solicitacoes_creator CASCADE;
DROP TRIGGER IF EXISTS public.backup_demandas_creator CASCADE;
DROP TRIGGER IF EXISTS public.backup_solicitacoes_creator CASCADE;
DROP TRIGGER IF EXISTS public.backup_demandas_creator CASCADE;
DROP TRIGGER IF EXISTS public.on_auth_user_created CASCADE;

-- 4. Remover TODAS as tabelas
DROP TABLE IF EXISTS public.solicitacoes CASCADE;
DROP TABLE IF EXISTS public.demandas CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.assuntos_padrao CASCADE;
DROP TABLE IF EXISTS public.pontos_contato CASCADE;

-- 5. Recriar estrutura BÁSICA e LIMPA
-- Tabela profiles (sem campos desnecessários por enquanto)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela solicitacoes (básica)
CREATE TABLE public.solicitacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assunto text NOT NULL,
  protocolo text NOT NULL,
  status text NOT NULL DEFAULT 'aguardando',
  data_inicio date,
  data_contato date,
  data_finalizado date,
  observacoes text DEFAULT '',
  responsavel text DEFAULT '',
  ponto_contato text DEFAULT '',
  user_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela demandas (básica)
CREATE TABLE public.demandas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assunto text NOT NULL,
  protocolo text NOT NULL,
  status text NOT NULL DEFAULT 'aguardando',
  data_inicio date,
  data_contato date,
  data_finalizado date,
  observacoes text DEFAULT '',
  responsavel text DEFAULT '',
  ponto_contato text DEFAULT '',
  user_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Garantir acesso TOTAL (sem RLS por enquanto)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.demandas DISABLE ROW LEVEL SECURITY;

GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.solicitacoes TO anon;
GRANT ALL ON public.solicitacoes TO authenticated;
GRANT ALL ON public.demandas TO anon;
GRANT ALL ON public.demandas TO authenticated;

-- 7. Log da operação
DO $$
BEGIN
    RAISE LOG 'RESET NUCLEAR COMPLETO aplicado em % - Todas as tabelas foram recriadas do zero';
END;
$$ LANGUAGE plpgsql;
