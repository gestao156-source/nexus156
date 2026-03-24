export type UserRole = 'admin' | 'user';

export type AcessoStatus = 'solicitado' | 'em_andamento' | 'criado' | 'ativo' | 'desativado';

// Tipos de notificações
export type NotificationType = 
  | 'new_item'           // Novo item criado
  | 'status_change'      // Mudança de status
  | 'deadline_warning'   // Aviso de prazo
  | 'deadline_passed'    // Prazo ultrapassado
  | 'assignment'         // Atribuição de responsável
  | 'comment'            // Comentário adicionado
  | 'system_alert'       // Alerta do sistema
  | 'reminder'           // Lembrete
  | 'summary';            // Resumo diário/semanal

export type NotificationStatus = 'unread' | 'read' | 'archived';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message?: string;
  metadata: Record<string, any>;
  status: NotificationStatus;
  priority: NotificationPriority;
  created_at: string;
  read_at?: string;
  expires_at: string;
  action_url?: string;
  action_text?: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_notifications: boolean;
  browser_notifications: boolean;
  sound_notifications: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  notification_types: Record<NotificationType, boolean>;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationData {
  user_id: string;
  type: NotificationType;
  title: string;
  message?: string;
  metadata?: Record<string, any>;
  priority?: NotificationPriority;
  action_url?: string;
  action_text?: string;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  createNotification: (data: CreateNotificationData) => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export type ItemStatus = 'aguardando' | 'em_analise' | 'finalizado';

export interface Solicitacao {
  id: string;
  assunto: string;
  protocolo: string;
  status: ItemStatus;
  data_inicio: string | null;
  data_contato: string | null;
  data_finalizado: string | null;
  responsavel: string;
  ponto_contato: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Demanda {
  id: string;
  assunto: string;
  protocolo: string;
  status: ItemStatus;
  data_inicio: string | null;
  data_contato: string | null;
  data_finalizado: string | null;
  responsavel: string;
  ponto_contato: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  aguardando: number;
  em_analise: number;
  finalizado: number;
}

export interface ItemDetalhes extends KanbanItem {
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_bairro?: string;
  endereco_localidade?: string;
  endereco_cep?: string;
  endereco_complemento?: string;
  endereco_latitude?: number | null;
  endereco_longitude?: number | null;
  profiles?: {
    full_name: string;
    email: string;
  };
  responsavel_profile?: {
    full_name: string;
    email: string;
  };
}

export interface KanbanItem {
  id: string;
  assunto: string;
  protocolo: string;
  status: ItemStatus;
  data_inicio: string | null;
  data_contato: string | null;
  data_finalizado: string | null;
  responsavel: string;
  ponto_contato: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  tipo: 'solicitacao' | 'demanda';
}

export interface Acesso {
  id: string;
  solicitante_wpp: string;
  servidor_beneficiado: string;
  data_solicitacao: string;
  data_criacao_acesso?: string;
  regional?: string;
  setor?: string;
  status: AcessoStatus;
  responsavel_nexus?: string;
  observacoes?: string;
  procedimentos_iniciais?: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Tipos para o sistema de mapa
export interface MapaFilters {
  status: string[];
  tipo: string;
  periodo: {
    inicio: Date;
    fim: Date;
  };
  regional: number;
  apenasComCoordenadas: boolean;
  apenasAtrasados: boolean;
  ordenarPor: string;
  ordem: 'ASC' | 'DESC';
}

export interface MapaItem {
  id: string;
  assunto: string;
  protocolo: string;
  status: string;
  tipo: 'solicitacao' | 'demanda';
  latitude?: number;
  longitude?: number;
  possui_coordenadas: boolean;
  responsavel: string;
  ponto_contato: string;
  created_at: string;
  updated_at: string;
  data_inicio?: string | null;
  data_contato?: string | null;
  data_finalizado?: string | null;
  user_id?: string;
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_bairro?: string;
  endereco_localidade?: string;
  endereco_cidade?: string;
  endereco_uf?: string;
  endereco_cep?: string;
  endereco_complemento?: string;
  endereco_regional?: number;
  endereco_geocoding_status?: string;
  usuario_nome?: string;
  usuario_email?: string;
  atrasado: boolean;
  dias_atraso: number;
}

export interface MapaStats {
  total: number;
  comCoordenadas: number;
  semCoordenadas: number;
  porRegional: Record<string, number>;
  porStatus: Record<string, number>;
  atrasados: number;
  ultimoUpdate: Date;
}
