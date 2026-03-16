-- Corrigir RLS para permitir admins lerem profiles
-- Admins devem conseguir acesso completo à tabela profiles

-- Remover política existente (se existir)
DROP POLICY IF EXISTS "profiles_read_policy";

-- Criar política correta que permite admins lerem todos os profiles
CREATE POLICY "profiles_read_policy" AS (
  -- Permitir admins lerem todos os profiles
  -- Usuários normais podem ler apenas o próprio profile
  USING (
    (
      -- Admin pode ler tudo
      (
        auth.jwt() -> 'role' = 'admin',
        auth.uid() = auth.uid()
      )
      OR
      (
        -- Usuário normal pode ler apenas o próprio profile
        auth.uid() = auth.uid(),
        (
          id = auth.uid()
        )
      )
    )
  FOR ALL
  USING (
    -- Usar a tabela profiles
    profiles
    -- Condição: permitir acesso se a política permitir
    -- Para SELECT: verificar se o profile pertence ao usuário
    -- Para INSERT/UPDATE: permitir se for o próprio profile
    true
    -- Para DELETE: permitir apenas se for admin
    (
      auth.uid() = id OR
      (
        -- Admin pode deletar qualquer profile
        auth.jwt() -> 'role' = 'admin'
      )
      OR
      (
        -- Usuário normal só pode deletar o próprio profile
        auth.uid() = id AND
        id = auth.uid()
      )
    )
  )
);

-- Adicionar comentário explicativo
COMMENT ON POLICY "profiles_read_policy" IS 'Permite admins lerem todos os profiles, usuários normais apenas o próprio. Implementado em 2026-03-13 para corrigir problema de exportação.';
