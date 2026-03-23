-- CORREÇÃO DEFINITIVA DOS TRIGGERS DE NOTIFICAÇÃO
-- Baseado na estrutura REAL do banco de dados fornecida pelo usuário

-- 1. Limpar triggers antigos quebrados
DROP TRIGGER IF EXISTS trigger_new_solicitacao ON solicitacoes;
DROP TRIGGER IF EXISTS trigger_new_demanda ON demandas;
DROP TRIGGER IF EXISTS trigger_solicitacao_status_change ON solicitacoes;
DROP TRIGGER IF EXISTS trigger_demanda_status_change ON demandas;

DROP FUNCTION IF EXISTS trigger_new_solicitacao_notification();
DROP FUNCTION IF EXISTS trigger_new_demanda_notification();
DROP FUNCTION IF EXISTS trigger_status_change_notification();

-- 2. Function para notificar nova solicitação
CREATE OR REPLACE FUNCTION trigger_new_solicitacao_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_notification_id UUID;
  v_admin_record RECORD;
BEGIN
  -- Notificar responsável se atribuído (responsavel é UUID)
  IF NEW.responsavel IS NOT NULL THEN
    SELECT create_notification(
      NEW.responsavel,
      'assignment',
      'Nova Solicitação Atribuída',
      'Você foi atribuído à solicitação: ' || NEW.assunto,
      jsonb_build_object(
        'item_id', NEW.id,
        'item_type', 'solicitacao',
        'protocolo', NEW.protocolo,
        'solicitante', COALESCE(NEW.created_by_user_name, 'Não informado')
      ),
      'high',
      '/solicitacoes/' || NEW.id,
      'Ver Detalhes'
    ) INTO v_notification_id;
  END IF;
  
  -- Notificar admins sobre nova solicitação
  FOR v_admin_record IN 
    SELECT id FROM profiles WHERE role = 'admin' AND deleted_at IS NULL
  LOOP
    SELECT create_notification(
      v_admin_record.id,
      'new_item',
      'Nova Solicitação Criada',
      'Uma nova solicitação foi criada: ' || NEW.assunto,
      jsonb_build_object(
        'item_id', NEW.id,
        'item_type', 'solicitacao',
        'protocolo', NEW.protocolo,
        'solicitante', COALESCE(NEW.created_by_user_name, 'Não informado')
      ),
      'medium',
      '/solicitacoes/' || NEW.id,
      'Ver Detalhes'
    ) INTO v_notification_id;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function para notificar nova demanda
CREATE OR REPLACE FUNCTION trigger_new_demanda_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_notification_id UUID;
  v_admin_record RECORD;
BEGIN
  -- Notificar responsável se atribuído (responsavel é UUID)
  IF NEW.responsavel IS NOT NULL THEN
    SELECT create_notification(
      NEW.responsavel,
      'assignment',
      'Nova Demanda Atribuída',
      'Você foi atribuído à demanda: ' || NEW.assunto,
      jsonb_build_object(
        'item_id', NEW.id,
        'item_type', 'demanda',
        'protocolo', NEW.protocolo,
        'solicitante', COALESCE(NEW.created_by_user_name, 'Não informado')
      ),
      'high',
      '/demandas/' || NEW.id,
      'Ver Detalhes'
    ) INTO v_notification_id;
  END IF;
  
  -- Notificar admins sobre nova demanda
  FOR v_admin_record IN 
    SELECT id FROM profiles WHERE role = 'admin' AND deleted_at IS NULL
  LOOP
    SELECT create_notification(
      v_admin_record.id,
      'new_item',
      'Nova Demanda Criada',
      'Uma nova demanda foi criada: ' || NEW.assunto,
      jsonb_build_object(
        'item_id', NEW.id,
        'item_type', 'demanda',
        'protocolo', NEW.protocolo,
        'solicitante', COALESCE(NEW.created_by_user_name, 'Não informado')
      ),
      'medium',
      '/demandas/' || NEW.id,
      'Ver Detalhes'
    ) INTO v_notification_id;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function para notificar mudança de status
CREATE OR REPLACE FUNCTION trigger_status_change_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_notification_id UUID;
  v_old_status TEXT;
  v_new_status TEXT;
  v_item_type TEXT;
  v_item_label TEXT;
  v_priority TEXT;
BEGIN
  -- Determinar tipo de item
  IF TG_TABLE_NAME = 'solicitacoes' THEN
    v_item_type := 'solicitacao';
    v_item_label := 'Solicitação';
  ELSIF TG_TABLE_NAME = 'demandas' THEN
    v_item_type := 'demanda';
    v_item_label := 'Demanda';
  ELSE
    RETURN NEW;
  END IF;
  
  -- Mapear status para texto amigável
  v_old_status := CASE OLD.status
    WHEN 'aguardando' THEN 'Aguardando Análise'
    WHEN 'em_analise' THEN 'Em Análise'
    WHEN 'finalizado' THEN 'Finalizado'
    ELSE OLD.status
  END;
  
  v_new_status := CASE NEW.status
    WHEN 'aguardando' THEN 'Aguardando Análise'
    WHEN 'em_analise' THEN 'Em Análise'
    WHEN 'finalizado' THEN 'Finalizado'
    ELSE NEW.status
  END;
  
  -- Determinar prioridade
  v_priority := CASE NEW.status
    WHEN 'finalizado' THEN 'low'
    WHEN 'em_analise' THEN 'high'
    ELSE 'medium'
  END;
  
  -- Notificar responsável sobre mudança de status
  IF NEW.responsavel IS NOT NULL AND OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT create_notification(
      NEW.responsavel,
      'status_change',
      'Status Alterado: ' || NEW.assunto,
      'Status alterado de ' || v_old_status || ' para ' || v_new_status,
      jsonb_build_object(
        'item_id', NEW.id,
        'item_type', v_item_type,
        'protocolo', NEW.protocolo,
        'old_status', OLD.status,
        'new_status', NEW.status
      ),
      v_priority,
      '/' || v_item_type || 's/' || NEW.id,
      'Ver Detalhes'
    ) INTO v_notification_id;
  END IF;
  
  -- Notificar admins quando finalizar
  IF NEW.status = 'finalizado' AND OLD.status IS DISTINCT FROM NEW.status THEN
    FOR v_admin_record IN 
      SELECT id FROM profiles WHERE role = 'admin' AND deleted_at IS NULL
    LOOP
      SELECT create_notification(
        v_admin_record.id,
        'status_change',
        v_item_label || ' Finalizada',
        NEW.assunto || ' foi finalizada com sucesso',
        jsonb_build_object(
          'item_id', NEW.id,
          'item_type', v_item_type,
          'protocolo', NEW.protocolo,
          'status', NEW.status
        ),
        'low',
        '/' || v_item_type || 's/' || NEW.id,
        'Ver Detalhes'
      ) INTO v_notification_id;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Criar triggers corrigidos
CREATE TRIGGER trigger_new_solicitacao
  AFTER INSERT ON solicitacoes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_new_solicitacao_notification();

CREATE TRIGGER trigger_new_demanda
  AFTER INSERT ON demandas
  FOR EACH ROW
  EXECUTE FUNCTION trigger_new_demanda_notification();

CREATE TRIGGER trigger_solicitacao_status_change
  AFTER UPDATE ON solicitacoes
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trigger_status_change_notification();

CREATE TRIGGER trigger_demanda_status_change
  AFTER UPDATE ON demandas
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trigger_status_change_notification();

-- 6. Grant permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Confirmação
SELECT 'Triggers de notificação corrigidos e ativados com sucesso!' as status;
