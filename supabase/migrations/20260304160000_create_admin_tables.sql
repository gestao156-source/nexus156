/*
  # Create Admin Management Tables
  
  1. New Tables
    - `assuntos_padrao`
      - `id` (uuid, primary key)
      - `nome` (text) - Subject name
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `pontos_contato`
      - `id` (uuid, primary key)
      - `nome` (text) - Contact point name
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on new tables
    - Add policies for admin users
    - Admin users can manage all data
*/

-- Create assuntos_padrao table
CREATE TABLE IF NOT EXISTS assuntos_padrao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create pontos_contato table  
CREATE TABLE IF NOT EXISTS pontos_contato (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE assuntos_padrao ENABLE ROW LEVEL SECURITY;
ALTER TABLE pontos_contato ENABLE ROW LEVEL SECURITY;

-- Policies for admin users on assuntos_padrao
CREATE POLICY "Admins can manage assuntos_padrao" ON assuntos_padrao
  FOR ALL USING (
    auth.role() = 'admin'
  );

-- Policies for admin users on pontos_contato
CREATE POLICY "Admins can manage pontos_contato" ON pontos_contato
  FOR ALL USING (
    auth.role() = 'admin'
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assuntos_padrao_nome ON assuntos_padrao(nome);
CREATE INDEX IF NOT EXISTS idx_pontos_contato_nome ON pontos_contato(nome);
