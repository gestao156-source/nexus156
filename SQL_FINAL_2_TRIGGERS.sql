-- Migration: Criar triggers automáticos para notificações (VERSÃO FINAL CORRIGIDA)
-- Versão: 20260323161000_create_notification_triggers.sql
-- Descrição: Triggers automáticos para eventos importantes

-- Trigger para novas solicitações
CREATE OR REPLACE FUNCTION trigger_new_solicitacao_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_id UUID;
  admins UUID[];
BEGIN
  -- Notificar admins sobre nova solicitação
  SELECT ARRAY_AGG(id) INTO admins
  FROM profiles
  WHERE role = 'admin' AND (deleted_at IS NULL OR deleted_at IS NULL);
  
  IF array_length(admins, 1) > 0 THEN
    FOREACH admin_id IN ARRAY admins
    LOOP
      SELECT create_notification(
        admin_id,
        'new_item',
        'Nova Solicitação Criada',
        CONCAT('Uma nova solicitação foi criada: ', NEW.assunto),
        jsonb_build_object(
          'item_id', NEW.id,
          'item_type', 'solicitacao',
          'protocolo', NEW.protocolo,
          'solicitante', NEW.solicitante_wpp
        ),
        'medium',
        CONCAT('/solicitacoes/', NEW.id),
        'Ver Detalhes'
      ) INTO notification_id;
    END LOOP;
  END IF;
  
  -- Notificar responsável se atribuído
  IF NEW.responsavel IS NOT NULL AND NEW.responsavel != '' THEN
    SELECT create_notification(
      NEW.responsavel,
      'assignment',
      'Nova Solicitação Atribuída',
      CONCAT('Você foi atribuído à solicitação: ', NEW.assunto),
      jsonb_build_object(
        'item_id', NEW.id,
        'item_type', 'solicitacao',
        'protocolo', NEW.protocolo,
        'solicitante', NEW.solicitante_wpp
      ),
      'high',
      CONCAT('/solicitacoes/', NEW.id),
      'Ver Detalhes'
    ) INTO notification_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para novas demandas
CREATE OR REPLACE FUNCTION trigger_new_demanda_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_id UUID;
  admins UUID[];
BEGIN
  -- Notificar admins sobre nova demanda
  SELECT ARRAY_AGG(id) INTO admins
  FROM profiles
  WHERE role = 'admin' AND (deleted_at IS NULL OR deleted_at IS NULL);
  
  IF array_length(admins, 1) > 0 THEN
    FOREACH admin_id IN ARRAY admins
    LOOP
      SELECT create_notification(
        admin_id,
        'new_item',
        'Nova Demanda Criada',
        CONCAT('Uma nova demanda foi criada: ', NEW.assunto),
        jsonb_build_object(
          'item_id', NEW.id,
          'item_type', 'demanda',
          'protocolo', NEW.protocolo,
          'solicitante', NEW.solicitante_wpp
        ),
        'medium',
        CONCAT('/demandas/', NEW.id),
        'Ver Detalhes'
      ) INTO notification_id;
    END LOOP;
  END IF;
  
  -- Notificar responsável se atribuído
  IF NEW.responsavel IS NOT NULL AND NEW.responsavel != '' THEN
    SELECT create_notification(
      NEW.responsavel,
      'assignment',
      'Nova Demanda Atribuída',
      CONCAT('Você foi atribuído à demanda: ', NEW.assunto),
      jsonb_build_object(
        'item_id', NEW.id,
        'item_type', 'demanda',
        'protocolo', NEW.protocolo,
        'solicitante', NEW.solicitante_wpp
      ),
      'high',
      CONCAT('/demandas/', NEW.id),
      'Ver Detalhes'
    ) INTO notification_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para mudanças de status
CREATE OR REPLACE FUNCTION trigger_status_change_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_id UUID;
  old_status_text TEXT;
  new_status_text TEXT;
  item_type TEXT;
BEGIN
  -- Determinar tipo de item
  IF TG_TABLE_NAME = 'solicitacoes' THEN
    item_type := 'solicitacao';
  ELSIF TG_TABLE_NAME = 'demandas' THEN
    item_type := 'demanda';
  ELSE
    RETURN NEW;
  END IF;
  
  -- Mapear status para texto amigável
  old_status_text := CASE OLD.status
    WHEN 'aguardando' THEN 'Aguardando Análise'
    WHEN 'em_analise' THEN 'Em Análise'
    WHEN 'finalizado' THEN 'Finalizado'
    ELSE OLD.status
  END;
  
  new_status_text := CASE NEW.status
    WHEN 'aguardando' THEN 'Aguardando Análise'
    WHEN 'em_analise' THEN 'Em Análise'
    WHEN 'finalizado' THEN 'Finalizado'
    ELSE NEW.status
  END;
  
  -- Notificar responsável sobre mudança de status
  IF NEW.responsavel IS NOT NULL AND NEW.responsavel != '' 
     AND OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- Determinar prioridade baseada no novo status
    DECLARE
      priority VARCHAR(10) := 'medium';
    BEGIN
      IF NEW.status = 'finalizado' THEN
        priority := 'low';
      ELSIF NEW.status = 'em_analise' THEN
        priority := 'high';
      END IF;
    
      SELECT create_notification(
        NEW.responsavel,
        'status_change',
        CONCAT('Status Alterado: ', NEW.assunto),
        CONCAT('Status alterado de ', old_status_text, ' para ', new_status_text),
        jsonb_build_object(
          'item_id', NEW.id,
          'item_type', item_type,
          'protocolo', NEW.protocolo,
          'old_status', OLD.status,
          'new_status', NEW.status
        ),
        priority,
        CASE 
          WHEN item_type = 'solicitacao' THEN CONCAT('/solicitacoes/', NEW.id)
          ELSE CONCAT('/demandas/', NEW.id)
        END,
        'Ver Detalhes'
      ) INTO notification_id;
    END;
  END IF;
  
  -- Notificar admins sobre finalização
  IF NEW.status = 'finalizado' AND OLD.status IS DISTINCT FROM NEW.status THEN
    DECLARE
      admins UUID[];
    BEGIN
      SELECT ARRAY_AGG(id) INTO admins
      FROM profiles
      WHERE role = 'admin' AND (deleted_at IS NULL OR deleted_at IS NULL);
      
      IF array_length(admins, 1) > 0 THEN
        FOREACH admin_id IN ARRAY admins
        LOOP
          SELECT create_notification(
            admin_id,
            'status_change',
            CONCAT(item_type = 'solicitacao' ? 'Solicitação' : 'Demanda', ' Finalizada'),
            CONCAT(NEW.assunto, ' foi finalizada com sucesso'),
            jsonb_build_object(
              'item_id', NEW.id,
              'item_type', item_type,
              'protocolo', NEW.protocolo,
              'status', NEW.status
            ),
            'low',
            CASE 
              WHEN item_type = 'solicitacao' THEN CONCAT('/solicitacoes/', NEW.id)
              ELSE CONCAT('/demandas/', NEW.id)
            END,
            'Ver Detalhes'
          ) INTO notification_id;
        END LOOP;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para avisos de prazo
CREATE OR REPLACE FUNCTION trigger_deadline_warning_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_id UUID;
  days_until_deadline INTEGER;
BEGIN
  -- Calcular dias até o prazo
  SELECT (NEW.data_prazo - CURRENT_DATE) INTO days_until_deadline;
  
  -- Notificar se estiver próximo do prazo (3 dias ou menos)
  IF days_until_deadline <= 3 AND days_until_deadline >= 0 THEN
    IF NEW.responsavel IS NOT NULL AND NEW.responsavel != '' THEN
      DECLARE
        priority VARCHAR(10);
        message TEXT;
      BEGIN
        IF days_until_deadline = 0 THEN
          priority := 'urgent';
          message := 'Prazo vence hoje!';
        ELSIF days_until_deadline = 1 THEN
          priority := 'urgent';
          message := 'Prazo vence amanhã!';
        ELSE
          priority := 'high';
          message := CONCAT('Prazo vence em ', days_until_deadline, ' dias');
        END IF;
      
        SELECT create_notification(
          NEW.responsavel,
          'deadline_warning',
          CONCAT('Aviso de Prazo: ', NEW.assunto),
          message,
          jsonb_build_object(
            'item_id', NEW.id,
            'item_type', TG_TABLE_NAME = 'solicitacoes' ? 'solicitacao' : 'demanda',
            'protocolo', NEW.protocolo,
            'data_prazo', NEW.data_prazo,
            'days_until', days_until_deadline
          ),
          priority,
          CASE 
            WHEN TG_TABLE_NAME = 'solicitacoes' THEN CONCAT('/solicitacoes/', NEW.id)
            ELSE CONCAT('/demandas/', NEW.id)
          END,
          'Ver Detalhes'
        ) INTO notification_id;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para prazo ultrapassado
CREATE OR REPLACE FUNCTION trigger_deadline_passed_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_id UUID;
  days_overdue INTEGER;
BEGIN
  -- Calcular dias de atraso
  SELECT (CURRENT_DATE - NEW.data_prazo) INTO days_overdue;
  
  -- Notificar se prazo foi ultrapassado e item não está finalizado
  IF days_overdue > 0 AND NEW.status != 'finalizado' THEN
    IF NEW.responsavel IS NOT NULL AND NEW.responsavel != '' THEN
      SELECT create_notification(
        NEW.responsavel,
        'deadline_passed',
        CONCAT('Prazo Ultrapassado: ', NEW.assunto),
        CONCAT('Prazo ultrapassado há ', days_overdue, ' dias'),
        jsonb_build_object(
          'item_id', NEW.id,
          'item_type', TG_TABLE_NAME = 'solicitacoes' ? 'solicitacao' : 'demanda',
          'protocolo', NEW.protocolo,
          'data_prazo', NEW.data_prazo,
          'days_overdue', days_overdue
        ),
        'urgent',
        CASE 
          WHEN TG_TABLE_NAME = 'solicitacoes' THEN CONCAT('/solicitacoes/', NEW.id)
          ELSE CONCAT('/demandas/', NEW.id)
        END,
        'Ver Detalhes'
      ) INTO notification_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar triggers para solicitacoes
DROP TRIGGER IF EXISTS trigger_new_solicitacao ON solicitacoes;
CREATE TRIGGER trigger_new_solicitacao
  AFTER INSERT ON solicitacoes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_new_solicitacao_notification();

DROP TRIGGER IF EXISTS trigger_solicitacao_status_change ON solicitacoes;
CREATE TRIGGER trigger_solicitacao_status_change
  AFTER UPDATE ON solicitacoes
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trigger_status_change_notification();

DROP TRIGGER IF EXISTS trigger_solicitacao_deadline_warning ON solicitacoes;
CREATE TRIGGER trigger_solicitacao_deadline_warning
  AFTER UPDATE ON solicitacoes
  FOR EACH ROW
  WHEN (OLD.data_prazo IS DISTINCT FROM NEW.data_prazo OR NEW.data_prazo IS NOT NULL)
  EXECUTE FUNCTION trigger_deadline_warning_notification();

DROP TRIGGER IF EXISTS trigger_solicitacao_deadline_passed ON solicitacoes;
CREATE TRIGGER trigger_solicitacao_deadline_passed
  AFTER UPDATE ON solicitacoes
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status OR NEW.data_prazo IS NOT NULL)
  EXECUTE FUNCTION trigger_deadline_passed_notification();

-- Criar triggers para demandas
DROP TRIGGER IF EXISTS trigger_new_demanda ON demandas;
CREATE TRIGGER trigger_new_demanda
  AFTER INSERT ON demandas
  FOR EACH ROW
  EXECUTE FUNCTION trigger_new_demanda_notification();

DROP TRIGGER IF EXISTS trigger_demanda_status_change ON demandas;
CREATE TRIGGER trigger_demanda_status_change
  AFTER UPDATE ON demandas
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trigger_status_change_notification();

DROP TRIGGER IF EXISTS trigger_demanda_deadline_warning ON demandas;
CREATE TRIGGER trigger_demanda_deadline_warning
  AFTER UPDATE ON demandas
  FOR EACH ROW
  WHEN (OLD.data_prazo IS DISTINCT FROM NEW.data_prazo OR NEW.data_prazo IS NOT NULL)
  EXECUTE FUNCTION trigger_deadline_warning_notification();

DROP TRIGGER IF EXISTS trigger_demanda_deadline_passed ON demandas;
CREATE TRIGGER trigger_demanda_deadline_passed
  AFTER UPDATE ON demandas
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status OR NEW.data_prazo IS NOT NULL)
  EXECUTE FUNCTION trigger_deadline_passed_notification();

-- Função para verificar notificações de prazo (executar diariamente)
CREATE OR REPLACE FUNCTION check_deadline_notifications()
RETURNS INTEGER AS $$
DECLARE
  notifications_created INTEGER := 0;
  notification_id UUID;
BEGIN
  -- Verificar solicitações próximas do prazo
  FOR item IN 
    SELECT id, responsavel, assunto, protocolo, data_prazo, 'solicitacao' as item_type
    FROM solicitacoes
    WHERE status != 'finalizado'
      AND data_prazo IS NOT NULL
      AND data_prazo BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '3 days')
      AND responsavel IS NOT NULL
      AND responsavel != ''
  LOOP
    SELECT create_notification(
      item.responsavel,
      'deadline_warning',
      'Aviso de Prazo Próximo',
      CONCAT('Aviso: ', item.assunto, ' com prazo próximo'),
      jsonb_build_object(
        'item_id', item.id,
        'item_type', item.item_type,
        'protocolo', item.protocolo,
        'data_prazo', item.data_prazo
      ),
      'high',
      CONCAT('/solicitacoes/', item.id),
      'Ver Detalhes'
    ) INTO notification_id;
    
    IF notification_id IS NOT NULL THEN
      notifications_created := notifications_created + 1;
    END IF;
  END LOOP;
  
  -- Verificar demandas próximas do prazo
  FOR item IN 
    SELECT id, responsavel, assunto, protocolo, data_prazo, 'demanda' as item_type
    FROM demandas
    WHERE status != 'finalizado'
      AND data_prazo IS NOT NULL
      AND data_prazo BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '3 days')
      AND responsavel IS NOT NULL
      AND responsavel != ''
  LOOP
    SELECT create_notification(
      item.responsavel,
      'deadline_warning',
      'Aviso de Prazo Próximo',
      CONCAT('Aviso: ', item.assunto, ' com prazo próximo'),
      jsonb_build_object(
        'item_id', item.id,
        'item_type', item.item_type,
        'protocolo', item.protocolo,
        'data_prazo', item.data_prazo
      ),
      'high',
      CONCAT('/demandas/', item.id),
      'Ver Detalhes'
    ) INTO notification_id;
    
    IF notification_id IS NOT NULL THEN
      notifications_created := notifications_created + 1;
    END IF;
  END LOOP;
  
  RETURN notifications_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
