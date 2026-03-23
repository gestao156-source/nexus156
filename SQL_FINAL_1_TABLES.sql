-- Migration: Criar tabela de notificações (VERSÃO FINAL CORRIGIDA)
-- Versão: 20260323160000_create_notifications_table.sql
-- Descrição: Sistema completo de notificações persistentes

-- Tabela principal de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'new_item',           -- Novo item criado
    'status_change',      -- Mudança de status
    'deadline_warning',   -- Aviso de prazo
    'deadline_passed',    -- Prazo ultrapassado
    'assignment',         -- Atribuição de responsável
    'comment',            -- Comentário adicionado
    'system_alert',       -- Alerta do sistema
    'reminder',           -- Lembrete
    'summary'             -- Resumo diário/semanal
  )),
  title VARCHAR(255) NOT NULL,
  message TEXT,
  metadata JSONB DEFAULT '{}', -- Dados adicionais: item_id, item_type, old_status, new_status, etc.
  status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  action_url TEXT, -- URL para ação direta (ex: /solicitacoes/123)
  action_text VARCHAR(100) -- Texto do botão de ação (ex: "Ver Detalhes"
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at);

-- Índice composto para consultas comuns
CREATE INDEX IF NOT EXISTS idx_notifications_user_status_created 
  ON notifications(user_id, status, created_at DESC);

-- Tabela de preferências de notificação
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  browser_notifications BOOLEAN DEFAULT true,
  sound_notifications BOOLEAN DEFAULT false,
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  notification_types JSONB DEFAULT '{
    "new_item": true,
    "status_change": true,
    "deadline_warning": true,
    "deadline_passed": true,
    "assignment": true,
    "comment": false,
    "system_alert": true,
    "reminder": false,
    "summary": false
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para preferências
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id 
  ON notification_preferences(user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) para notificações
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para notification_preferences
CREATE POLICY "Users can view own preferences" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Função para criar notificação (RPC) - VERSÃO FINAL CORRIGIDA
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR(50),
  p_title VARCHAR(255),
  p_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_priority VARCHAR(10) DEFAULT 'medium',
  p_action_url TEXT DEFAULT NULL,
  p_action_text VARCHAR(100) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
  user_prefs RECORD;
  should_create BOOLEAN := true;
  current_time TIME;
BEGIN
  -- Verificar se usuário existe
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Obter hora atual
  current_time := CURRENT_TIME;
  
  -- Verificar preferências do usuário
  SELECT * INTO user_prefs 
  FROM notification_preferences 
  WHERE user_id = p_user_id;
  
  -- Se não tiver preferências, usar defaults
  IF user_prefs IS NULL THEN
    INSERT INTO notification_preferences (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    SELECT * INTO user_prefs 
    FROM notification_preferences 
    WHERE user_id = p_user_id;
  END IF;
  
  -- Verificar se usuário quer este tipo de notificação
  IF user_prefs.notification_types ? p_type IS NOT NULL THEN
    should_create := (user_prefs.notification_types ->> p_type)::BOOLEAN;
  END IF;
  
  -- Verificar quiet hours
  IF user_prefs.quiet_hours_enabled AND should_create THEN
    IF current_time >= user_prefs.quiet_hours_start AND 
       current_time <= user_prefs.quiet_hours_end THEN
      -- Só criar notificações urgentes durante quiet hours
      should_create := (p_priority = 'urgent');
    END IF;
  END IF;
  
  -- Criar notificação se permitido
  IF should_create THEN
    INSERT INTO notifications (
      user_id, type, title, message, metadata, priority, action_url, action_text
    ) VALUES (
      p_user_id, p_type, p_title, p_message, p_metadata, p_priority, p_action_url, p_action_text
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
  ELSE
    RETURN NULL; -- Notificação bloqueada por preferências
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para marcar notificação como lida (RPC)
CREATE OR REPLACE FUNCTION mark_notification_read(
  p_notification_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications 
  SET status = 'read', read_at = NOW()
  WHERE id = p_notification_id 
    AND user_id = p_user_id 
    AND status = 'unread';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para marcar todas como lidas (RPC)
CREATE OR REPLACE FUNCTION mark_all_notifications_read(
  p_user_id UUID
) RETURNS INTEGER AS $$
DECLARE
  marked_count INTEGER;
BEGIN
  UPDATE notifications 
  SET status = 'read', read_at = NOW()
  WHERE user_id = p_user_id 
    AND status = 'unread';
  
  GET DIAGNOSTICS marked_count = ROW_COUNT;
  
  RETURN marked_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter notificações do usuário (RPC)
CREATE OR REPLACE FUNCTION get_user_notifications(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_status VARCHAR(20) DEFAULT NULL,
  p_type VARCHAR(50) DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  type VARCHAR(50),
  title VARCHAR(255),
  message TEXT,
  metadata JSONB,
  status VARCHAR(20),
  priority VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  action_text VARCHAR(100)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.type,
    n.title,
    n.message,
    n.metadata,
    n.status,
    n.priority,
    n.created_at,
    n.read_at,
    n.action_url,
    n.action_text
  FROM notifications n
  WHERE n.user_id = p_user_id
    AND (p_status IS NULL OR n.status = p_status)
    AND (p_type IS NULL OR n.type = p_type)
    AND n.expires_at > NOW()
  ORDER BY n.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para contar notificações não lidas (RPC)
CREATE OR REPLACE FUNCTION count_unread_notifications(
  p_user_id UUID
) RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unread_count
  FROM notifications
  WHERE user_id = p_user_id 
    AND status = 'unread'
    AND expires_at > NOW();
  
  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notification_preferences TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Criar preferências padrão para usuários existentes
INSERT INTO notification_preferences (user_id)
SELECT id FROM profiles 
WHERE id NOT IN (SELECT user_id FROM notification_preferences);
