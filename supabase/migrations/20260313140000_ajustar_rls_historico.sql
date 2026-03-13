/*
  # Ajustar RLS para Controle de Acesso do Histórico
  
  Esta migration ajusta e otimiza as políticas RLS para a tabela historico_procedimentos,
  garantindo que apenas usuários autorizados possam visualizar e adicionar procedimentos.
*/

-- Remover políticas existentes para recriação
DROP POLICY IF EXISTS "Users can view relevant procedimentos" ON historico_procedimentos;
DROP POLICY IF EXISTS "Users can insert relevant procedimentos" ON historico_procedimentos;

-- Política melhorada para visualização de procedimentos
CREATE POLICY "Users can view relevant procedimentos"
  ON historico_procedimentos FOR SELECT
  TO authenticated
  USING (
    -- Admin pode ver tudo
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- Criador do item pode ver
    EXISTS (
      SELECT 1 FROM solicitacoes s
      WHERE s.id = historico_procedimentos.item_id 
      AND historico_procedimentos.item_tipo = 'solicitacao'
      AND s.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM demandas d
      WHERE d.id = historico_procedimentos.item_id 
      AND historico_procedimentos.item_tipo = 'demanda'
      AND d.user_id = auth.uid()
    )
    OR
    -- Responsável pelo item pode ver
    EXISTS (
      SELECT 1 FROM solicitacoes s
      WHERE s.id = historico_procedimentos.item_id 
      AND historico_procedimentos.item_tipo = 'solicitacao'
      AND s.responsavel IS NOT NULL
      AND NULLIF(TRIM(s.responsavel), '')::text::uuid = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM demandas d
      WHERE d.id = historico_procedimentos.item_id 
      AND historico_procedimentos.item_tipo = 'demanda'
      AND d.responsavel IS NOT NULL
      AND NULLIF(TRIM(d.responsavel), '')::text::uuid = auth.uid()
    )
  );

-- Política melhorada para inserção de procedimentos
CREATE POLICY "Users can insert relevant procedimentos"
  ON historico_procedimentos FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Admin pode inserir em qualquer item
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
    OR
    -- Criador do item pode inserir
    EXISTS (
      SELECT 1 FROM solicitacoes s
      WHERE s.id = historico_procedimentos.item_id 
      AND historico_procedimentos.item_tipo = 'solicitacao'
      AND s.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM demandas d
      WHERE d.id = historico_procedimentos.item_id 
      AND historico_procedimentos.item_tipo = 'demanda'
      AND d.user_id = auth.uid()
    )
    OR
    -- Responsável pelo item pode inserir
    EXISTS (
      SELECT 1 FROM solicitacoes s
      WHERE s.id = historico_procedimentos.item_id 
      AND historico_procedimentos.item_tipo = 'solicitacao'
      AND s.responsavel IS NOT NULL
      AND NULLIF(TRIM(s.responsavel), '')::text::uuid = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM demandas d
      WHERE d.id = historico_procedimentos.item_id 
      AND historico_procedimentos.item_tipo = 'demanda'
      AND d.responsavel IS NOT NULL
      AND NULLIF(TRIM(d.responsavel), '')::text::uuid = auth.uid()
    )
  );

-- Função auxiliar para verificar permissões
CREATE OR REPLACE FUNCTION verificar_permissao_historico(
  p_item_id uuid,
  p_item_tipo text,
  p_usuario_id uuid
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_e_admin BOOLEAN := FALSE;
  v_e_criador BOOLEAN := FALSE;
  v_e_responsavel BOOLEAN := FALSE;
BEGIN
  -- Verificar se é admin
  SELECT (role = 'admin') INTO v_e_admin
  FROM profiles
  WHERE id = p_usuario_id;
  
  IF v_e_admin THEN
    RETURN TRUE;
  END IF;
  
  -- Verificar se é criador
  IF p_item_tipo = 'solicitacao' THEN
    SELECT (user_id = p_usuario_id) INTO v_e_criador
    FROM solicitacoes
    WHERE id = p_item_id;
    
    SELECT (responsavel IS NOT NULL AND NULLIF(TRIM(responsavel), '')::text::uuid = p_usuario_id) INTO v_e_responsavel
    FROM solicitacoes
    WHERE id = p_item_id;
  ELSIF p_item_tipo = 'demanda' THEN
    SELECT (user_id = p_usuario_id) INTO v_e_criador
    FROM demandas
    WHERE id = p_item_id;
    
    SELECT (responsavel IS NOT NULL AND NULLIF(TRIM(responsavel), '')::text::uuid = p_usuario_id) INTO v_e_responsavel
    FROM demandas
    WHERE id = p_item_id;
  END IF;
  
  RETURN v_e_criador OR v_e_responsavel;
END;
$$;

-- Atualizar RPC functions para usar a nova verificação
CREATE OR REPLACE FUNCTION adicionar_procedimento(
  p_item_id uuid,
  p_item_tipo text,
  p_procedimento text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_usuario_id uuid := auth.uid();
  v_usuario_nome text;
  v_usuario_email text;
  v_procedimento_id uuid;
  v_tem_permissao BOOLEAN;
BEGIN
  -- Verificar permissões
  v_tem_permissao := verificar_permissao_historico(p_item_id, p_item_tipo, v_usuario_id);
  
  IF NOT v_tem_permissao THEN
    RAISE EXCEPTION 'Usuário não tem permissão para adicionar procedimentos neste item';
  END IF;
  
  -- Get user info
  SELECT full_name, email INTO v_usuario_nome, v_usuario_email
  FROM profiles
  WHERE id = v_usuario_id;
  
  -- Insert procedimento
  INSERT INTO historico_procedimentos (
    item_id, item_tipo, procedimento, usuario_id, usuario_nome, usuario_email
  ) VALUES (
    p_item_id, p_item_tipo, p_procedimento, v_usuario_id, v_usuario_nome, v_usuario_email
  ) RETURNING id INTO v_procedimento_id;
  
  RETURN v_procedimento_id;
END;
$$;

-- Verificação final
DO $$
BEGIN
  RAISE NOTICE '=== RLS DO HISTÓRICO ATUALIZADO ===';
  RAISE NOTICE '✅ Políticas de visualização e inserção recriadas';
  RAISE NOTICE '✅ Função de verificação de permissões criada';
  RAISE NOTICE '✅ RPC functions atualizadas com validação';
  RAISE NOTICE '=================================';
END $$;
