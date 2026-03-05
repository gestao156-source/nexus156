/*
  Fix RLS Policies for Collaborative Access
  
  Esta migração corrige as políticas RLS para permitir que usuários comuns
  visualizem todas as solicitações e demandas (colaboração),
  mantendo restrições para edição/exclusão.
  
  Problema: Usuários viam apenas seus próprios itens
  Solução: Permitir visualização de todos os itens, restringir escrita
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Users can insert own solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Users can update own solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Users can delete own solicitacoes" ON solicitacoes;

DROP POLICY IF EXISTS "Users can view own demandas" ON demandas;
DROP POLICY IF EXISTS "Users can insert own demandas" ON demandas;
DROP POLICY IF EXISTS "Users can update own demandas" ON demandas;
DROP POLICY IF EXISTS "Users can delete own demandas" ON demandas;

-- New collaborative policies for solicitacoes
-- Todos os usuários autenticados podem ver todas as solicitações
CREATE POLICY "Users can view all solicitacoes"
  ON solicitacoes FOR SELECT
  TO authenticated
  USING (true);

-- Todos os usuários autenticados podem criar solicitações
CREATE POLICY "Users can insert solicitacoes"
  ON solicitacoes FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Usuários podem atualizar apenas seus próprios itens OU admins podem atualizar qualquer item
CREATE POLICY "Users can update own solicitacoes"
  ON solicitacoes FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Usuários podem deletar apenas seus próprios itens OU admins podem deletar qualquer item
CREATE POLICY "Users can delete own solicitacoes"
  ON solicitacoes FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- New collaborative policies for demandas
-- Todos os usuários autenticados podem ver todas as demandas
CREATE POLICY "Users can view all demandas"
  ON demandas FOR SELECT
  TO authenticated
  USING (true);

-- Todos os usuários autenticados podem criar demandas
CREATE POLICY "Users can insert demandas"
  ON demandas FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Usuários podem atualizar apenas seus próprios itens OU admins podem atualizar qualquer item
CREATE POLICY "Users can update own demandas"
  ON demandas FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Usuários podem deletar apenas seus próprios itens OU admins podem deletar qualquer item
CREATE POLICY "Users can delete own demandas"
  ON demandas FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Verificar se as políticas foram criadas corretamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('solicitacoes', 'demandas')
ORDER BY tablename, policyname;

-- Log da migração
INSERT INTO admin_logs (operation, old_value, new_value, created_by, created_at)
VALUES (
  'rls_policy_update', 
  'restrictive_user_access', 
  'collaborative_user_access', 
  auth.uid(), 
  NOW()
);
