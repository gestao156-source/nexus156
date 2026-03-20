export type UserRole = 'admin' | 'user';

export type AcessoStatus = 'solicitado' | 'em_andamento' | 'criado' | 'ativo' | 'desativado';

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
  data_criacao_acesso: string | null;
  regional: string | null;
  setor: string | null;
  status: AcessoStatus;
  responsavel_nexus: string | null;
  observacoes: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}
