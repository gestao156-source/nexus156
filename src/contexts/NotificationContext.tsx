import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { 
  Notification, 
  NotificationPreferences, 
  NotificationContextType, 
  CreateNotificationData
} from '../types';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar preferências do usuário
  const loadPreferences = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        // Criar preferências padrão
        const defaultPreferences = {
          user_id: user.id,
          email_notifications: true,
          browser_notifications: true,
          sound_notifications: false,
          quiet_hours_enabled: false,
          quiet_hours_start: '22:00',
          quiet_hours_end: '08:00',
          notification_types: {
            new_item: true,
            status_change: true,
            deadline_warning: true,
            deadline_passed: true,
            assignment: true,
            comment: false,
            system_alert: true,
            reminder: false,
            summary: false
          }
        };

        const { data: newPrefs, error: insertError } = await supabase
          .from('notification_preferences')
          .insert(defaultPreferences)
          .select()
          .single();

        if (insertError) throw insertError;
        setPreferences(newPrefs);
      } else {
        setPreferences(data);
      }
    } catch (err) {
      console.error('Erro ao carregar preferências:', err);
      setError('Não foi possível carregar preferências');
    }
  }, [user]);

  // Carregar notificações do usuário
  const loadNotifications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .rpc('get_user_notifications', {
          p_user_id: user.id,
          p_limit: 50,
          p_status: 'unread'
        });

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
      setError('Não foi possível carregar notificações');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Configurar subscription em tempo real
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user_notifications_${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('Notificação recebida:', payload);
        
        if (payload.eventType === 'INSERT') {
          setNotifications(prev => [payload.new as Notification, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setNotifications(prev => 
            prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
          );
        } else if (payload.eventType === 'DELETE') {
          setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
        }
      })
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      loadPreferences();
      loadNotifications();
    }
  }, [user, loadPreferences, loadNotifications]);

  // Marcar notificação como lida
  const markAsRead = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .rpc('mark_notification_read', {
          p_notification_id: id,
          p_user_id: user.id
        });

      if (error) throw error;

      // Atualizar estado local
      setNotifications(prev => 
        prev.map(n => 
          n.id === id 
            ? { ...n, status: 'read' as const, read_at: new Date().toISOString() }
            : n
        )
      );
    } catch (err) {
      console.error('Erro ao marcar notificação como lida:', err);
      setError('Não foi possível marcar como lida');
    }
  }, [user]);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .rpc('mark_all_notifications_read', {
          p_user_id: user.id
        });

      if (error) throw error;

      // Atualizar estado local
      setNotifications(prev => 
        prev.map(n => ({ 
          ...n, 
          status: 'read' as const, 
          read_at: new Date().toISOString() 
        }))
      );
    } catch (err) {
      console.error('Erro ao marcar todas como lidas:', err);
      setError('Não foi possível marcar todas como lidas');
    }
  }, [user]);

  // Criar notificação manual
  const createNotification = useCallback(async (data: CreateNotificationData) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .rpc('create_notification', {
          p_user_id: data.user_id,
          p_type: data.type,
          p_title: data.title,
          p_message: data.message,
          p_metadata: data.metadata,
          p_priority: data.priority || 'medium',
          p_action_url: data.action_url,
          p_action_text: data.action_text
        });

      if (error) throw error;
    } catch (err) {
      console.error('Erro ao criar notificação:', err);
      setError('Não foi possível criar notificação');
    }
  }, [user]);

  // Atualizar preferências
  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    if (!user || !preferences) return;

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update({
          ...newPreferences,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Atualizar estado local
      setPreferences(prev => prev ? { ...prev, ...newPreferences } : null);
    } catch (err) {
      console.error('Erro ao atualizar preferências:', err);
      setError('Não foi possível atualizar preferências');
    }
  }, [user, preferences]);

  // Atualizar contagem de não lidas
  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  // Refresh notificações
  const refreshNotifications = useCallback(async () => {
    await loadNotifications();
  }, [loadNotifications]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    createNotification,
    updatePreferences,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

