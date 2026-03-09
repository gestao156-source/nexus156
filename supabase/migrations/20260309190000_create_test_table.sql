/*
  Create Test Table
  
  Cria uma tabela simples sem RLS para testar se o problema
  está nas políticas ou em outra coisa.
*/

-- Create simple test table without RLS
CREATE TABLE IF NOT EXISTS test_table (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert some test data
INSERT INTO test_table (name) VALUES 
  ('Test Item 1'),
  ('Test Item 2'),
  ('Test Item 3')
ON CONFLICT DO NOTHING;

-- Grant public access
GRANT ALL ON test_table TO anon;
GRANT ALL ON test_table TO authenticated;
