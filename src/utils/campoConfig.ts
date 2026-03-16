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
        atrasado: 'Atrasado',
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

  // Endereço
  endereco_cep: {
    id: 'endereco_cep',
    label: 'CEP',
    obrigatorio: false,
    grupo: 'Endereço',
    accessor: 'endereco_cep',
  },
  endereco_rua: {
    id: 'endereco_rua',
    label: 'Rua/Avenida',
    obrigatorio: false,
    grupo: 'Endereço',
    accessor: 'endereco_rua',
  },
  endereco_numero: {
    id: 'endereco_numero',
    label: 'Número',
    obrigatorio: false,
    grupo: 'Endereço',
    accessor: 'endereco_numero',
  },
  endereco_bairro: {
    id: 'endereco_bairro',
    label: 'Bairro',
    obrigatorio: false,
    grupo: 'Endereço',
    accessor: 'endereco_bairro',
  },
  endereco_localidade: {
    id: 'endereco_localidade',
    label: 'Localidade/Cidade',
    obrigatorio: false,
    grupo: 'Endereço',
    accessor: 'endereco_localidade',
  },
  endereco_complemento: {
    id: 'endereco_complemento',
    label: 'Complemento',
    obrigatorio: false,
    grupo: 'Endereço',
    accessor: 'endereco_complemento',
  },
  endereco_completo: {
    id: 'endereco_completo',
    label: 'Endereço Completo',
    obrigatorio: false,
    grupo: 'Endereço',
    accessor: 'endereco_completo',
    format: (value: any) => {
      if (!value || typeof value !== 'object') return 'Não aplicável';
      
      const partes = [];
      if (value.endereco_rua) {
        partes.push(value.endereco_rua);
        if (value.endereco_numero) partes.push(value.endereco_numero);
      }
      if (value.endereco_bairro) partes.push(`- ${value.endereco_bairro}`);
      if (value.endereco_localidade) partes.push(`, ${value.endereco_localidade}`);
      if (value.endereco_cep) partes.push(`- CEP: ${value.endereco_cep}`);
      
      return partes.length > 0 ? partes.join(' ') : 'Não aplicável';
    },
  },
  coordenadas: {
    id: 'coordenadas',
    label: 'Coordenadas (Lat, Lng)',
    obrigatorio: false,
    grupo: 'Endereço',
    accessor: 'coordenadas',
    format: (value: any) => {
      if (!value || typeof value !== 'object') return 'Não aplicável';
      if (value.latitude && value.longitude) {
        return `${value.latitude.toFixed(6)}, ${value.longitude.toFixed(6)}`;
      }
      return 'Não aplicável';
    },
  },
};

export const CAMPOS_GRUPOS = [
  'Informações Básicas',
  'Datas e Prazos',
  'Cálculos e Métricas',
  'Informações Adicionais',
  'Endereço',
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
  
  // Tratar campos de endereço vazios como "Não aplicável"
  if (campoId.startsWith('endereco_') || campoId === 'coordenadas') {
    if (!valor || valor === '' || valor === null || valor === undefined) {
      return 'Não aplicável';
    }
  }
  
  if (valor === null || valor === undefined) return '';
  return valor.toString();
};
