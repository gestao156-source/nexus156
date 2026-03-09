/*
  Drop All Policies and Triggers
  
  Remove completamente todas as políticas e triggers que podem estar
  causando recursão infinita. Começar do zero.
*/

-- Drop ALL policies
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

-- Drop triggers that might cause recursion
DROP TRIGGER IF EXISTS backup_solicitacoes_creator ON solicitacoes;
DROP TRIGGER IF EXISTS backup_demandas_creator ON demandas;
DROP TRIGGER IF EXISTS validate_solicitacoes_coordinates ON solicitacoes;
DROP TRIGGER IF EXISTS validate_demandas_coordinates ON demandas;
DROP FUNCTION IF EXISTS backup_creator_info();
DROP FUNCTION IF EXISTS validate_endereco_coordinates();

-- Disable RLS completely for now
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE solicitacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE demandas DISABLE ROW LEVEL SECURITY;
