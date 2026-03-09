/*
  Update Delete User Function for Soft Delete
  
  Atualiza a função delete_user_complete para implementar soft delete:
  1. Marca usuário como deletado em vez de excluir
  2. Remove usuário do auth.users mas mantém dados
  3. Preserva todas as solicitações/demandas criadas
*/

-- Drop da função antiga
DROP FUNCTION IF EXISTS delete_user_complete(uuid);

-- Criar nova função com soft delete
CREATE OR REPLACE FUNCTION delete_user_complete(user_id_to_delete uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_role text;
    target_user_info record;
BEGIN
    -- Verificar se o usuário atual é admin e não está deletado
    SELECT role INTO current_user_role 
    FROM profiles 
    WHERE id = auth.uid() AND deleted_at IS NULL;
    
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Apenas administradores podem deletar usuários';
    END IF;
    
    -- Verificar se o usuário alvo existe e não está deletado
    SELECT full_name, email INTO target_user_info
    FROM profiles 
    WHERE id = user_id_to_delete AND deleted_at IS NULL;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuário não encontrado ou já deletado';
    END IF;
    
    -- 1. Soft delete do perfil (marcar como deletado)
    UPDATE profiles 
    SET 
        deleted_at = NOW(),
        deleted_by = auth.uid()
    WHERE id = user_id_to_delete;
    
    -- 2. Remover usuário do auth.users (mas manter dados nas outras tabelas)
    -- As solicitações/demandas terão user_id = NULL mas manterão os campos de backup
    DELETE FROM auth.users WHERE id = user_id_to_delete;
    
    -- Log da operação (se tabela admin_logs existir)
    BEGIN
        INSERT INTO admin_logs (
            operation, 
            target_user_id, 
            old_value, 
            new_value, 
            created_by
        ) VALUES (
            'SOFT_DELETE_USER',
            user_id_to_delete,
            json_build_object(
                'full_name', target_user_info.full_name,
                'email', target_user_info.email
            ),
            json_build_object(
                'deleted_at', NOW(),
                'deleted_by', auth.uid()
            ),
            auth.uid()
        );
    EXCEPTION WHEN undefined_table THEN
        -- Se admin_logs não existir, apenas continua
        NULL;
    END;
    
    RETURN true;
END;
$$;

-- Grant permissão para authenticated executar a função
GRANT EXECUTE ON FUNCTION delete_user_complete(uuid) TO authenticated;

-- Criar função adicional para restaurar usuário (se necessário)
CREATE OR REPLACE FUNCTION restore_user_deleted(user_id_to_restore uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_role text;
    target_user_info record;
BEGIN
    -- Verificar se o usuário atual é admin
    SELECT role INTO current_user_role 
    FROM profiles 
    WHERE id = auth.uid() AND deleted_at IS NULL;
    
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Apenas administradores podem restaurar usuários';
    END IF;
    
    -- Verificar se o usuário está deletado
    SELECT full_name, email INTO target_user_info
    FROM profiles 
    WHERE id = user_id_to_restore AND deleted_at IS NOT NULL;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Usuário não encontrado ou não está deletado';
    END IF;
    
    -- Restaurar usuário (remover marca de deletado)
    UPDATE profiles 
    SET 
        deleted_at = NULL,
        deleted_by = NULL
    WHERE id = user_id_to_restore;
    
    -- Log da operação
    BEGIN
        INSERT INTO admin_logs (
            operation, 
            target_user_id, 
            old_value, 
            new_value, 
            created_by
        ) VALUES (
            'RESTORE_USER',
            user_id_to_restore,
            json_build_object(
                'deleted_at', target_user_info.deleted_at,
                'deleted_by', target_user_info.deleted_by
            ),
            json_build_object(
                'restored_at', NOW(),
                'restored_by', auth.uid()
            ),
            auth.uid()
        );
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    RETURN true;
END;
$$;

-- Grant permissão para authenticated executar a função de restauração
GRANT EXECUTE ON FUNCTION restore_user_deleted(uuid) TO authenticated;

-- Criar view para usuários ativos (não deletados)
CREATE OR REPLACE VIEW active_profiles AS
SELECT 
    id, 
    email, 
    full_name, 
    role, 
    created_at, 
    updated_at
FROM profiles 
WHERE deleted_at IS NULL;

-- Criar view para usuários deletados (para auditoria)
CREATE OR REPLACE VIEW deleted_profiles AS
SELECT 
    id, 
    email, 
    full_name, 
    role, 
    created_at, 
    updated_at,
    deleted_at,
    deleted_by
FROM profiles 
WHERE deleted_at IS NOT NULL;

-- Grant permissions nas views
GRANT SELECT ON active_profiles TO authenticated;
GRANT SELECT ON deleted_profiles TO authenticated;
