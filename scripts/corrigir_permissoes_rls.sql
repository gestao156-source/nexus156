-- Script para corrigir permissões RLS
-- Execute este script diretamente no SQL Editor do Supabase

-- Remover políticas antigas
DROP POLICY IF EXISTS "Admins can manage assuntos_padrao" ON assuntos_padrao;
DROP POLICY IF EXISTS "Admins can manage pontos_contato" ON pontos_contato;

-- Criar políticas de leitura pública
CREATE POLICY "Enable read access for all users" ON assuntos_padrao
  FOR SELECT USING (true);
  
CREATE POLICY "Enable read access for all users" ON pontos_contato
  FOR SELECT USING (true);

-- Manter políticas de admin para escrita
CREATE POLICY "Admins can manage assuntos_padrao" ON assuntos_padrao
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
  
CREATE POLICY "Admins can manage pontos_contato" ON pontos_contato
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('assuntos_padrao', 'pontos_contato')
ORDER BY tablename, policyname;
