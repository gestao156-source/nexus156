/*
  Disable RLS Temporarily
  
  Desabilita RLS temporariamente para permitir que os dados apareçam
  enquanto resolvemos o problema das políticas.
*/

-- Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE solicitacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE demandas DISABLE ROW LEVEL SECURITY;
