/*
  Add DELETE Policy for Profiles Table
  
  Adiciona RLS policy para permitir que admins excluam perfis de usuários.
  Isso corrige o problema de exclusão de usuários no painel admin.
*/

-- Adicionar policy DELETE para profiles
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
