/*
  Fix RPC Function Permissions
  
  This migration fixes the permissions issue with update_user_role RPC function
  by adding proper SECURITY DEFINER and search_path settings.
*/

-- Drop and recreate with proper permissions
DROP FUNCTION IF EXISTS update_user_role(user_id uuid, new_role text);

-- Recreate function with correct permissions
CREATE OR REPLACE FUNCTION update_user_role(user_id uuid, new_role text)
RETURNS boolean 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
    current_user_role text;
    target_user_role text;
    admin_count integer;
BEGIN
    -- Debug log
    RAISE NOTICE 'update_user_role called: user_id=%, new_role=%, auth.uid()=%', 
                 user_id, new_role, auth.uid();
    
    -- Verificar se usuário atual é admin
    SELECT role INTO current_user_role 
    FROM profiles 
    WHERE id = auth.uid();
    
    RAISE NOTICE 'Current user role: %', current_user_role;
    
    IF current_user_role != 'admin' THEN
        RAISE EXCEPTION 'Apenas admin pode alterar roles. Current role: %', current_user_role;
    END IF;
    
    -- Impedir auto-alteração
    IF user_id = auth.uid() THEN
        RAISE EXCEPTION 'Não pode alterar próprio role';
    END IF;
    
    -- Verificar se role é válido
    IF new_role NOT IN ('admin', 'user') THEN
        RAISE EXCEPTION 'Role inválido. Use admin ou user';
    END IF;
    
    -- Verificar se usuário alvo existe
    SELECT role INTO target_user_role
    FROM profiles 
    WHERE id = user_id;
    
    IF target_user_role IS NULL THEN
        RAISE EXCEPTION 'Usuário não encontrado';
    END IF;
    
    -- Verificar mínimo de admins (se estiver removendo admin)
    IF target_user_role = 'admin' AND new_role = 'user' THEN
        SELECT COUNT(*) INTO admin_count
        FROM profiles 
        WHERE role = 'admin';
        
        IF admin_count <= 1 THEN
            RAISE EXCEPTION 'Não pode remover o último admin. Total admins: %', admin_count;
        END IF;
    END IF;
    
    -- Atualizar role
    UPDATE profiles 
    SET role = new_role,
        updated_at = now()
    WHERE id = user_id;
    
    -- Log da operação
    RAISE NOTICE 'Role updated: % -> % for user %', target_user_role, new_role, user_id;
    
    -- Log da operação (se existir tabela de logs)
    BEGIN
        INSERT INTO admin_logs (operation, target_user_id, old_value, new_value, created_by, created_at)
        VALUES ('role_update', user_id, target_user_role, new_role, auth.uid(), now());
    EXCEPTION
        WHEN undefined_table THEN
            -- Tabela de logs não existe, ignorar
            NULL;
    END;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_role TO service_role;
