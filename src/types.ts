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
  status: string;
  data_inicio: string | null;
  data_contato: string | null;
  data_finalizado: string | null;
  responsavel: string;
  ponto_contato: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  endereco_rua: string;
  endereco_numero: string;
  endereco_bairro: string;
  endereco_localidade: string;
  endereco_cep: string;
  endereco_complemento: string;
  endereco_latitude: number | null;
  endereco_longitude: number | null;
  tipo: 'solicitacao' | 'demanda';
}

export interface DashboardStats {
  aguardando: number;
  em_analise: number;
  finalizado: number;
}

// Tipos para o Mapa Interativo
export interface MapaFilters {
  status: string[];
  tipo: string; // 'todos', 'solicitacao', 'demanda', ''
  periodo: { inicio: Date; fim: Date };
  regional: number;
  apenasComCoordenadas: boolean;
  ordenarPor: string;
  ordem: string;
}

export interface MapaItem {
  id: string;
  tipo: 'solicitacao' | 'demanda';
  assunto: string;
  protocolo: string;
  status: string;
  responsavel: string;
  ponto_contato: string;
  endereco_rua: string;
  endereco_numero: string;
  endereco_bairro: string;
  endereco_complemento: string;
  endereco_cep: string;
  endereco_cidade: string;
  endereco_uf: string;
  endereco_latitude?: number;
  endereco_longitude?: number;
  endereco_regional: number;
  endereco_geocoding_status: 'pendente' | 'sucesso' | 'falha' | 'manual';
  endereco_validado: boolean;
  possui_coordenadas: boolean;
  usuario_nome: string;
  usuario_email: string;
  created_at: string;
  data_inicio?: string;
  data_contato?: string;
  data_finalizado?: string;
}

export interface MapaStats {
  total: number;
  comCoordenadas: number;
  semCoordenadas: number;
  porRegional: Record<number, number>;
  porStatus: Record<string, number>;
  ultimoUpdate: Date;
}

export interface RegionalConfig {
  id: number;
  nome: string;
  territorios: { [key: number]: string[] };
  bairros: string[];
  coordenadas_centrais: { lat: number; lng: number };
  cor: string;
  limite_pins: number;
}

export interface Coordenadas {
  lat: number;
  lng: number;
}

export interface EnderecoCompleto {
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  localidade: string;
  complemento: string;
  latitude?: number;
  longitude?: number;
}
