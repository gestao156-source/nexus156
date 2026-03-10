export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

export type ItemStatus = 'aguardando' | 'em_analise' | 'finalizado';

export interface KanbanItem {
  id: string;
  assunto: string;
  protocolo: string;
  status: ItemStatus;
  data_inicio: string | null;
  data_contato: string | null;
  data_finalizado: string | null;
  observacoes: string;
  responsavel: string;
  ponto_contato: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  created_by_user_name?: string;
  created_by_user_email?: string;
  
  // Campos de endereço (opcionais - compatível)
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_bairro?: string;
  endereco_localidade?: string;
  endereco_cep?: string;
  endereco_complemento?: string;
  latitude?: number;
  longitude?: number;
}

export interface DashboardStats {
  aguardando: number;
  em_analise: number;
  finalizado: number;
}
