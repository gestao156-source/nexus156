/*
  Fix RLS Infinite Recursion
  
  Remove TODAS as políticas e cria políticas simples sem subqueries
  para evitar recursão infinita.
*/

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

DROP POLICY IF EXISTS "Users can view own solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Users can insert own solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Users can update own solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Users can delete own solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Authenticated users can view items" ON solicitacoes;

DROP POLICY IF EXISTS "Users can view own demandas" ON demandas;
DROP POLICY IF EXISTS "Users can insert own demandas" ON demandas;
DROP POLICY IF EXISTS "Users can update own demandas" ON demandas;
DROP POLICY IF EXISTS "Users can delete own demandas" ON demandas;
DROP POLICY IF EXISTS "Authenticated users can view items" ON demandas;

-- Simple policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Simple policies for solicitacoes
CREATE POLICY "Users can view solicitacoes"
  ON solicitacoes FOR SELECT
  TO authenticated
  USING (true);  -- Temporarily allow all authenticated users to view

CREATE POLICY "Users can insert solicitacoes"
  ON solicitacoes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update solicitacoes"
  ON solicitacoes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete solicitacoes"
  ON solicitacoes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Simple policies for demandas
CREATE POLICY "Users can view demandas"
  ON demandas FOR SELECT
  TO authenticated
  USING (true);  -- Temporarily allow all authenticated users to view

CREATE POLICY "Users can insert demandas"
  ON demandas FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update demandas"
  ON demandas FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete demandas"
  ON demandas FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
