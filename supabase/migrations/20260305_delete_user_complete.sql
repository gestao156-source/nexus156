/*
  Complete User Deletion Function
  
  Cria função RPC para deletar completamente um usuário:
  1. Deleta o perfil da tabela profiles
  2. Deleta o usuário da tabela auth.users
  3. Usa SECURITY DEFINER para ter permissões necessárias
*/

-- Criar função para deletar usuário completamente
CREATE OR REPLACE FUNCTION delete_user_complete(user_id_to_delete uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_role text;
BEGIN
    -- Verificar se o usuário atual é admin
    SELECT role INTO current_user_role 
    FROM profiles 
    WHERE id = auth.uid();
    
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Apenas administradores podem deletar usuários';
    END IF;
    
    -- Deletar o perfil (isso vai deletar solicitacoes/demandas em cascata)
    DELETE FROM profiles WHERE id = user_id_to_delete;
    
    -- Deletar o usuário do auth
    DELETE FROM auth.users WHERE id = user_id_to_delete;
    
    RETURN true;
END;
$$;

-- Grant permissão para authenticated executar a função
GRANT EXECUTE ON FUNCTION delete_user_complete(uuid) TO authenticated;
