import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface CampoConfig {
  id: string;
  label: string;
  obrigatorio: boolean;
  grupo: string;
  accessor: string;
  format?: (value: any) => string;
}

export const CAMPOS_DISPONIVEIS: Record<string, CampoConfig> = {
  // Informações Básicas
  protocolo: {
    id: 'protocolo',
    label: 'Protocolo',
    obrigatorio: true,
    grupo: 'Informações Básicas',
    accessor: 'protocolo',
  },
  tipo: {
    id: 'tipo',
    label: 'Tipo',
    obrigatorio: true,
    grupo: 'Informações Básicas',
    accessor: 'tipo',
    format: (value: string) => value === 'solicitacao' ? 'Solicitação' : 'Demanda',
  },
  assunto: {
    id: 'assunto',
    label: 'Assunto',
    obrigatorio: false,
    grupo: 'Informações Básicas',
    accessor: 'assunto',
  },
  status: {
    id: 'status',
    label: 'Status',
    obrigatorio: false,
    grupo: 'Informações Básicas',
    accessor: 'status',
    format: (value: string) => {
      const statusMap: Record<string, string> = {
        aguardando: 'Aguardando Análise',
        em_analise: 'Em Análise',
        finalizado: 'Finalizado',
      };
      return statusMap[value] || value;
    },
  },
  responsavel: {
    id: 'responsavel',
    label: 'Responsável',
    obrigatorio: false,
    grupo: 'Informações Básicas',
    accessor: 'responsavel',
  },
  ponto_contato: {
    id: 'ponto_contato',
    label: 'Ponto Contato',
    obrigatorio: false,
    grupo: 'Informações Básicas',
    accessor: 'ponto_contato',
  },
  usuario_criador: {
    id: 'usuario_criador',
    label: 'Usuário Criador',
    obrigatorio: false,
    grupo: 'Informações Básicas',
    accessor: 'usuario_criador',
  },

  // Datas e Prazos
  data_criacao: {
    id: 'data_criacao',
    label: 'Data Criação',
    obrigatorio: false,
    grupo: 'Datas e Prazos',
    accessor: 'created_at',
    format: (value: string) => format(new Date(value), 'dd/MM/yyyy', { locale: ptBR }),
  },
  data_inicio: {
    id: 'data_inicio',
    label: 'Data Início',
    obrigatorio: false,
    grupo: 'Datas e Prazos',
    accessor: 'data_inicio',
    format: (value: string | null) => value ? format(new Date(value), 'dd/MM/yyyy', { locale: ptBR }) : '',
  },
  data_contato: {
    id: 'data_contato',
    label: 'Data Contato',
    obrigatorio: false,
    grupo: 'Datas e Prazos',
    accessor: 'data_contato',
    format: (value: string | null) => value ? format(new Date(value), 'dd/MM/yyyy', { locale: ptBR }) : '',
  },
  data_finalizacao: {
    id: 'data_finalizacao',
    label: 'Data Finalização',
    obrigatorio: false,
    grupo: 'Datas e Prazos',
    accessor: 'data_finalizado',
    format: (value: string | null) => value ? format(new Date(value), 'dd/MM/yyyy', { locale: ptBR }) : '',
  },
  ultima_atualizacao: {
    id: 'ultima_atualizacao',
    label: 'Última Atualização',
    obrigatorio: false,
    grupo: 'Datas e Prazos',
    accessor: 'updated_at',
    format: (value: string) => format(new Date(value), 'dd/MM/yyyy', { locale: ptBR }),
  },

  // Cálculos e Métricas
  dias_em_aberto: {
    id: 'dias_em_aberto',
    label: 'Dias em Aberto',
    obrigatorio: false,
    grupo: 'Cálculos e Métricas',
    accessor: 'dias_em_aberto',
    format: (value: number) => value.toString(),
  },
  dias_uteis: {
    id: 'dias_uteis',
    label: 'Dias Úteis',
    obrigatorio: false,
    grupo: 'Cálculos e Métricas',
    accessor: 'dias_uteis',
    format: (value: number) => value.toString(),
  },
  tempo_atendimento: {
    id: 'tempo_atendimento',
    label: 'Tempo Atendimento',
    obrigatorio: false,
    grupo: 'Cálculos e Métricas',
    accessor: 'tempo_atendimento',
    format: (value: number) => value.toString(),
  },
  status_atraso: {
    id: 'status_atraso',
    label: 'Status de Atraso',
    obrigatorio: false,
    grupo: 'Cálculos e Métricas',
    accessor: 'status_atraso',
    format: (value: boolean) => value ? 'Sim' : 'Não',
  },
  dias_atraso: {
    id: 'dias_atraso',
    label: 'Dias de Atraso',
    obrigatorio: false,
    grupo: 'Cálculos e Métricas',
    accessor: 'dias_atraso',
    format: (value: number) => value.toString(),
  },

  // Informações Adicionais
  observacoes: {
    id: 'observacoes',
    label: 'Observações',
    obrigatorio: false,
    grupo: 'Informações Adicionais',
    accessor: 'observacoes',
  },
  email_criador: {
    id: 'email_criador',
    label: 'Email do Criador',
    obrigatorio: false,
    grupo: 'Informações Adicionais',
    accessor: 'email_criador',
  },
  role_criador: {
    id: 'role_criador',
    label: 'Role do Criador',
    obrigatorio: false,
    grupo: 'Informações Adicionais',
    accessor: 'role_criador',
    format: (value: string) => value === 'admin' ? 'Administrador' : 'Usuário',
  },
};

export const CAMPOS_GRUPOS = [
  'Informações Básicas',
  'Datas e Prazos',
  'Cálculos e Métricas',
  'Informações Adicionais',
];

export const getCamposPorGrupo = (grupo: string): CampoConfig[] => {
  return Object.values(CAMPOS_DISPONIVEIS).filter(campo => campo.grupo === grupo);
};

export const formatarValorCampo = (campoId: string, valor: any): string => {
  const campo = CAMPOS_DISPONIVEIS[campoId];
  if (!campo) return '';
  
  if (campo.format) {
    return campo.format(valor);
  }
  
  if (valor === null || valor === undefined) return '';
  return valor.toString();
};
