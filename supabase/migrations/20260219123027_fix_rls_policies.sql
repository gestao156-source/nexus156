/*
  # Fix RLS Policies

  Corrigir as políticas RLS que estavam causando:
  1. Recursão infinita nas políticas de profiles
  2. Violação de RLS ao inserir solicitações/demandas
  
  Simplificar as políticas para evitar subqueries que causam recursão.
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

DROP POLICY IF EXISTS "Users can view own solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Users can insert own solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Users can update own solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Users can delete own solicitacoes" ON solicitacoes;

DROP POLICY IF EXISTS "Users can view own demandas" ON demandas;
DROP POLICY IF EXISTS "Users can insert own demandas" ON demandas;
DROP POLICY IF EXISTS "Users can update own demandas" ON demandas;
DROP POLICY IF EXISTS "Users can delete own demandas" ON demandas;

-- RLS Policies for profiles - simple approach
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for solicitacoes - allow users to manage their own
CREATE POLICY "Users can view own solicitacoes"
  ON solicitacoes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own solicitacoes"
  ON solicitacoes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own solicitacoes"
  ON solicitacoes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own solicitacoes"
  ON solicitacoes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for demandas - allow users to manage their own
CREATE POLICY "Users can view own demandas"
  ON demandas FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own demandas"
  ON demandas FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own demandas"
  ON demandas FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own demandas"
  ON demandas FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());