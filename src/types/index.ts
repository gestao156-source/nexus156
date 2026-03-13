export type UserRole = 'admin' | 'user';

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
