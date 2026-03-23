-- Migration: Corrigir função RPC para adicionar procedimentos
-- Data: 2026-03-23
-- Problema: Hook estava chamando função com parâmetros incorretos

-- Remover função antiga (se existir)
DROP FUNCTION IF EXISTS adicionar_historico_procedimento(
  p_item_id uuid,
  p_item_tipo text,
  p_procedimento text,
  p_usuario_id uuid,
  p_usuario_nome text,
  p_usuario_email text
);

-- Criar função correta com todos os parâmetros que o hook espera
CREATE OR REPLACE FUNCTION adicionar_historico_procedimento(
  p_item_id uuid,
  p_item_tipo text,
  p_procedimento text,
  p_usuario_id uuid,
  p_usuario_nome text,
  p_usuario_email text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_procedimento_id uuid;
BEGIN
  -- Validar parâmetros
  IF p_item_id IS NULL OR p_item_tipo IS NULL OR p_procedimento IS NULL THEN
    RAISE EXCEPTION 'Parâmetros obrigatórios não informados';
  END IF;
  
  -- Validar tipo do item
  IF p_item_tipo NOT IN ('solicitacao', 'demanda') THEN
    RAISE EXCEPTION 'Tipo de item inválido: %', p_item_tipo;
  END IF;
  
  -- Inserir procedimento com informações do usuário
  INSERT INTO historico_procedimentos (
    item_id, item_tipo, procedimento, usuario_id, usuario_nome, usuario_email
  ) VALUES (
    p_item_id, p_item_tipo, p_procedimento, p_usuario_id, p_usuario_nome, p_usuario_email
  ) RETURNING id INTO v_procedimento_id;
  
  RETURN v_procedimento_id;
END;
$$;
