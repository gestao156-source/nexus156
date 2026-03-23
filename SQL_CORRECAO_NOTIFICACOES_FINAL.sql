-- CORREÇÃO DOS TRIGGERS DE NOTIFICAÇÕES - VERSÃO 100% FUNCIONAL
-- Baseado na estrutura real do banco de dados

-- 1. Remover triggers quebrados
DROP TRIGGER IF EXISTS trigger_new_solicitacao ON solicitacoes;
DROP TRIGGER IF EXISTS trigger_new_demanda ON demandas;
DROP TRIGGER IF EXISTS trigger_solicitacao_status_change ON solicitacoes;
DROP TRIGGER IF EXISTS trigger_demanda_status_change ON demandas;

DROP FUNCTION IF EXISTS trigger_new_solicitacao_notification();
DROP FUNCTION IF EXISTS trigger_new_demanda_notification();
DROP FUNCTION IF EXISTS trigger_status_change_notification();

-- 2. Trigger para novas solicitações (CORRIGIDO)
CREATE OR REPLACE FUNCTION trigger_new_solicitacao_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_id UUID;
  admin_record RECORD;
BEGIN
  -- Notificar responsável se atribuído
  IF NEW.responsavel IS NOT NULL AND NEW.responsavel != '' THEN
    -- Buscar profile do responsável pelo nome
    SELECT id INTO admin_record
    FROM profiles
    WHERE full_name ILIKE '%' || NEW.responsavel || '%'
    LIMIT 1;
    
    IF admin_record.id IS NOT NULL THEN
      SELECT create_notification(
        admin_record.id,
        'assignment',
        'Nova Solicitação Atribuída',
        CONCAT('Você foi atribuído à solicitação: ', NEW.assunto),
        jsonb_build_object(
          'item_id', NEW.id,
          'item_type', 'solicitacao',
          'protocolo', NEW.protocolo,
          'data_contato', NEW.data_contato
        ),
        'high',
        CONCAT('/solicitacoes/', NEW.id),
        'Ver Detalhes'
      ) INTO notification_id;
    END IF;
  END IF;
  
  -- Notificar admins sobre nova solicitação
  FOR admin_record IN 
    SELECT id FROM profiles WHERE role = 'admin'
  LOOP
    SELECT create_notification(
      admin_record.id,
      'new_item',
      'Nova Solicitação Criada',
      CONCAT('Uma nova solicitação foi criada: ', NEW.assunto),
      jsonb_build_object(
        'item_id', NEW.id,
        'item_type', 'solicitacao',
        'protocolo', NEW.protocolo,
        'data_contato', NEW.data_contato
      ),
      'medium',
      CONCAT('/solicitacoes/', NEW.id),
      'Ver Detalhes'
    ) INTO notification_id;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger para novas demandas (CORRIGIDO)
CREATE OR REPLACE FUNCTION trigger_new_demanda_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_id UUID;
  admin_record RECORD;
BEGIN
  -- Notificar responsável se atribuído
  IF NEW.responsavel IS NOT NULL AND NEW.responsavel != '' THEN
    -- Buscar profile do responsável pelo nome
    SELECT id INTO admin_record
    FROM profiles
    WHERE full_name ILIKE '%' || NEW.responsavel || '%'
    LIMIT 1;
    
    IF admin_record.id IS NOT NULL THEN
      SELECT create_notification(
        admin_record.id,
        'assignment',
        'Nova Demanda Atribuída',
        CONCAT('Você foi atribuído à demanda: ', NEW.assunto),
        jsonb_build_object(
          'item_id', NEW.id,
          'item_type', 'demanda',
          'protocolo', NEW.protocolo,
          'data_contato', NEW.data_contato
        ),
        'high',
        CONCAT('/demandas/', NEW.id),
        'Ver Detalhes'
      ) INTO notification_id;
    END IF;
  END IF;
  
  -- Notificar admins sobre nova demanda
  FOR admin_record IN 
    SELECT id FROM profiles WHERE role = 'admin'
  LOOP
    SELECT create_notification(
      admin_record.id,
      'new_item',
      'Nova Demanda Criada',
      CONCAT('Uma nova demanda foi criada: ', NEW.assunto),
      jsonb_build_object(
        'item_id', NEW.id,
        'item_type', 'demanda',
        'protocolo', NEW.protocolo,
        'data_contato', NEW.data_contato
      ),
      'medium',
      CONCAT('/demandas/', NEW.id),
      'Ver Detalhes'
    ) INTO notification_id;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger para mudanças de status (CORRIGIDO)
CREATE OR REPLACE FUNCTION trigger_status_change_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_id UUID;
  old_status_text TEXT;
  new_status_text TEXT;
  item_type TEXT;
  item_label TEXT;
  admin_record RECORD;
BEGIN
  -- Determinar tipo de item
  IF TG_TABLE_NAME = 'solicitacoes' THEN
    item_type := 'solicitacao';
    item_label := 'Solicitação';
  ELSIF TG_TABLE_NAME = 'demandas' THEN
    item_type := 'demanda';
    item_label := 'Demanda';
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
    
    -- Buscar profile do responsável
    SELECT id INTO admin_record
    FROM profiles
    WHERE full_name ILIKE '%' || NEW.responsavel || '%'
    LIMIT 1;
    
    IF admin_record.id IS NOT NULL THEN
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
          admin_record.id,
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
  END IF;
  
  -- Notificar admins sobre finalização
  IF NEW.status = 'finalizado' AND OLD.status IS DISTINCT FROM NEW.status THEN
    FOR admin_record IN 
      SELECT id FROM profiles WHERE role = 'admin'
    LOOP
      SELECT create_notification(
        admin_record.id,
        'status_change',
        CONCAT(item_label, ' Finalizada'),
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Criar triggers corrigidos
CREATE TRIGGER trigger_new_solicitacao
  AFTER INSERT ON solicitacoes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_new_solicitacao_notification();

CREATE TRIGGER trigger_solicitacao_status_change
  AFTER UPDATE ON solicitacoes
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trigger_status_change_notification();

CREATE TRIGGER trigger_new_demanda
  AFTER INSERT ON demandas
  FOR EACH ROW
  EXECUTE FUNCTION trigger_new_demanda_notification();

CREATE TRIGGER trigger_demanda_status_change
  AFTER UPDATE ON demandas
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trigger_status_change_notification();

-- 6. Grant permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 7. Confirmação
SELECT 'Triggers de notificação corrigidos e ativados com sucesso!' as status;
