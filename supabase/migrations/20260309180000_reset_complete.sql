/*
  Complete Reset - Remove All RLS and Functions
  
  Remove TUDO que pode estar causando recursão:
  - Todas as políticas
  - Todas as funções
  - Todos os triggers
  - Desabilitar RLS completamente
*/

-- Drop ALL possible policies (com nomes diferentes)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;

DROP POLICY IF EXISTS "Users can view own solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Users can insert own solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Users can update own solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Users can delete own solicitacoes" ON solicitacoes;
DROP POLICY IF EXISTS "Authenticated users can view items" ON solicitacoes;
DROP POLICY IF EXISTS "Enable read access for all users" ON solicitacoes;

DROP POLICY IF EXISTS "Users can view own demandas" ON demandas;
DROP POLICY IF EXISTS "Users can insert own demandas" ON demandas;
DROP POLICY IF EXISTS "Users can update own demandas" ON demandas;
DROP POLICY IF EXISTS "Users can delete own demandas" ON demandas;
DROP POLICY IF EXISTS "Authenticated users can view items" ON demandas;
DROP POLICY IF EXISTS "Enable read access for all users" ON demandas;

-- Drop ALL possible triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS backup_solicitacoes_creator ON solicitacoes;
DROP TRIGGER IF EXISTS backup_demandas_creator ON demandas;
DROP TRIGGER IF EXISTS validate_solicitacoes_coordinates ON solicitacoes;
DROP TRIGGER IF EXISTS validate_demandas_coordinates ON demandas;

-- Drop ALL possible functions
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS backup_creator_info();
DROP FUNCTION IF EXISTS validate_endereco_coordinates();
DROP FUNCTION IF EXISTS validate_coordinates();
DROP FUNCTION IF EXISTS format_endereco_completo();
DROP FUNCTION IF EXISTS delete_user_complete(uuid);
DROP FUNCTION IF EXISTS restore_user_deleted(uuid);

-- Disable RLS completely
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE solicitacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE demandas DISABLE ROW LEVEL SECURITY;

-- Create simple public access policies (temporarily)
CREATE POLICY "Enable public access" ON profiles FOR SELECT USING (true);
CREATE POLICY "Enable public access" ON solicitacoes FOR SELECT USING (true);
CREATE POLICY "Enable public access" ON demandas FOR SELECT USING (true);

CREATE POLICY "Enable public insert" ON solicitacoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable public insert" ON demandas FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable public update" ON solicitacoes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable public update" ON demandas FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable public delete" ON solicitacoes FOR DELETE USING (true);
CREATE POLICY "Enable public delete" ON demandas FOR DELETE USING (true);
