/*
  Correções Críticas Imediatas
  
  Baseado nos erros do dashboard Supabase, corrige:
  1. Remove SECURITY DEFINER das views
  2. Corrige políticas RLS permissivas
  3. Remove funções com search_path mutable
  4. Protege tabelas sensíveis
*/

-- 1. Remover views problemáticas com SECURITY DEFINER
DROP VIEW IF EXISTS public.active_profiles;
DROP VIEW IF EXISTS public.demandas_com_endereco;
DROP VIEW IF EXISTS public.solicitacoes_com_endereco;
DROP VIEW IF EXISTS public.deleted_profiles;

-- Recriar views SEM SECURITY DEFINER
CREATE OR REPLACE VIEW solicitacoes_com_endereco AS
SELECT 
    s.*,
    COALESCE(s.endereco_rua, '') || 
           CASE WHEN s.endereco_rua IS NOT NULL AND s.endereco_numero IS NOT NULL THEN ', ' || s.endereco_numero ELSE '' END ||
           CASE WHEN (s.endereco_rua IS NOT NULL OR s.endereco_numero IS NOT NULL) AND s.endereco_bairro IS NOT NULL THEN ' - ' || s.endereco_bairro ELSE '' END ||
           CASE WHEN (s.endereco_rua IS NOT NULL OR s.endereco_numero IS NOT NULL OR s.endereco_bairro IS NOT NULL) AND s.endereco_localidade IS NOT NULL THEN ', ' || s.endereco_localidade ELSE '' END ||
           CASE WHEN s.endereco_cep IS NOT NULL THEN ' - CEP: ' || s.endereco_cep ELSE '' END
    ) AS endereco_completo
FROM solicitacoes s;

CREATE OR REPLACE VIEW demandas_com_endereco AS
SELECT 
    d.*,
    COALESCE(d.endereco_rua, '') || 
           CASE WHEN d.endereco_rua IS NOT NULL AND d.endereco_numero IS NOT NULL THEN ', ' || d.endereco_numero ELSE '' END ||
           CASE WHEN (d.endereco_rua IS NOT NULL OR d.endereco_numero IS NOT NULL) AND d.endereco_bairro IS NOT NULL THEN ' - ' || d.endereco_bairro ELSE '' END ||
           CASE WHEN (d.endereco_rua IS NOT NULL OR d.endereco_numero IS NOT NULL OR d.endereco_bairro IS NOT NULL) AND d.endereco_localidade IS NOT NULL THEN ', ' || d.endereco_localidade ELSE '' END ||
           CASE WHEN d.endereco_cep IS NOT NULL THEN ' - CEP: ' || d.endereco_cep ELSE '' END
    ) AS endereco_completo
FROM demandas d;

-- 2. Remover políticas RLS permissivas
DROP POLICY IF EXISTS "Users can insert solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Users can insert demandas" ON demandas;

-- Criar políticas seguras
CREATE POLICY "Users can insert own solicitacoes" ON solicitacoes
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own demandas" ON demandas
FOR INSERT WITH CHECK (user_id = auth.uid());

-- 3. Corrigir funções removendo search_path mutable
ALTER FUNCTION backup_creator_info() RESET search_path;
ALTER FUNCTION validate_coordinates() RESET search_path;
ALTER FUNCTION validate_endereco_coordinates() RESET search_path;
ALTER FUNCTION format_endereco_completo() RESET search_path;

-- 4. Proteger tabelas sensíveis (habilitar RLS se ainda estiver desabilitado)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandas ENABLE ROW LEVEL SECURITY;

-- 5. Garantir permissões adequadas
GRANT SELECT ON solicitacoes_com_endereco TO authenticated;
GRANT SELECT ON demandas_com_endereco TO authenticated;

-- Log da correção
DO $$
BEGIN
    RAISE LOG 'Correções críticas aplicadas em % - Views recriadas sem SECURITY DEFINER, políticas RLS corrigidas, funções ajustadas';
END;
$$ LANGUAGE plpgsql;
