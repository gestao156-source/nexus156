-- Migration: Adicionar políticas DELETE para demandas e solicitacoes
-- Data: 2026-03-23
-- Problema: RLS estava bloqueando exclusão silenciosamente

-- Remover políticas de delete existentes (se houver)
DROP POLICY IF EXISTS "Dono pode deletar solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Dono pode deletar demandas" ON demandas;

-- Criar política DELETE para solicitacoes
CREATE POLICY "Dono pode deletar solicitacoes"
ON solicitacoes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Criar política DELETE para demandas
CREATE POLICY "Dono pode deletar demandas"
ON demandas
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Garantir permissões DELETE
GRANT DELETE ON solicitacoes TO authenticated;
GRANT DELETE ON demandas TO authenticated;
