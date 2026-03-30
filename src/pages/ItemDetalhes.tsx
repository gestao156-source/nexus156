import { useState, useEffect } from 'react';
import { ArrowLeft, AlertTriangle, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface ItemDetalhes {
  id: string;
  protocolo: string;
  assunto: string;
  tipo: 'solicitacao' | 'demanda';
  status: string;
  created_at: string;
  user_id?: string;
  responsavel?: string;
  ponto_contato?: string;
  data_inicio?: string;
  data_contato?: string;
  data_finalizado?: string;
  endereco_bairro?: string;
  endereco_cep?: string;
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_complemento?: string;
  profiles?: {
    full_name?: string;
    email?: string;
  };
  responsavel_profile?: {
    full_name?: string;
    email?: string;
  };
}

export default function ItemDetalhes() {
  const [item, setItem] = useState<ItemDetalhes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchItemDetalhes = async () => {
    setLoading(true);
    setError(null);

    try {
      // Tentar buscar em solicitacoes primeiro
      console.log('📋 Buscando em solicitacoes...');
      const { data: querySol, error: querySolError } = await supabase
        .from('solicitacoes')
        .select('*')
        .eq('id', location.pathname.split('/')[2])
        .single();

      console.log('📋 Resultado solicitacoes:', { data: querySol, error: querySolError });

      if (querySolError || !querySol) {
        console.error('❌ Item não encontrado em solicitacoes');
        throw new Error('Item não encontrado em solicitacoes');
      }

      let query = querySol;
      let tipo = 'solicitacao';

      // Se não encontrou em solicitacoes, tentar demandas
      if (!query) {
        console.log('🔄 Tentando buscar em demandas...');
        const { data: queryDem, error: queryDemError } = await supabase
          .from('demandas')
          .select('*')
          .eq('id', location.pathname.split('/')[2])
          .single();

        console.log('📋 Resultado demandas:', { data: queryDem, error: queryDemError });

        if (queryDemError || !queryDem) {
          console.error('❌ Item não encontrado em demandas');
          throw new Error('Item não encontrado em demandas');
        }

        query = queryDem;
        tipo = 'demanda';
      }

      console.log('✅ Query final bem-sucedida:', query);

      const itemData = { ...query, tipo };

      // Buscar perfil do criador
      if (itemData.user_id) {
        const { data: creatorData } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', itemData.user_id)
          .single();

        if (creatorData) {
          itemData.profiles = creatorData;
        }
      }

      // Buscar responsável separadamente se existir
      if (itemData.responsavel) {
        const { data: respData } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', itemData.responsavel)
          .single();

        if (respData) {
          itemData.responsavel_profile = respData;
        }
      }

      setItem(itemData);
    } catch (error: unknown) {
      console.error('❌ Erro ao buscar detalhes do item:', error);
      setError('Erro ao carregar detalhes do item');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Não definido';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      aguardando: 'bg-gray-100 text-gray-800',
      em_analise: 'bg-yellow-100 text-yellow-800',
      finalizado: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      aguardando: 'Aguardando Análise',
      em_analise: 'Em Análise',
      finalizado: 'Finalizado'
    };
    return texts[status] || status;
  };

  const verificarAtraso = (status: string, dataContato?: string) => {
    if (!item) return false;
    
    const dataContatoDate = dataContato ? new Date(dataContato) : null;
    const createdDate = new Date(item.created_at);
    
    // Considera atrasado se: status = 'aguardando' E passaram mais de 7 dias desde o contato
    return status === 'aguardando' && dataContatoDate && 
           (createdDate.getTime() - dataContatoDate.getTime()) > (7 * 24 * 60 * 60 * 1000);
  };

  useEffect(() => {
    fetchItemDetalhes();
  }, [location.hash]);

  const estaAtrasado = item ? verificarAtraso(item.status, item.data_contato) : false;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error || 'Item não encontrado'}</div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{item.assunto}</h1>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {item.tipo === 'solicitacao' ? 'Solicitação' : 'Demanda'}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)}`}>
                  {getStatusText(item.status)}
                </span>
                {estaAtrasado && (
                  <div className="flex items-center space-x-1 bg-red-100 px-3 py-1 rounded-full">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-semibold text-red-700">Atrasado</span>
                  </div>
                )}
              </div>
            </div>
            <div className="ml-4">
              {/* Botão de impressão removido temporariamente */}
            </div>
          </div>
        </div>

        {/* Informações Gerais - Padrão Impressão */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 border-l-4 border-blue-600 pl-3">
            Informações Gerais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Protocolo</div>
              <div className="font-medium text-gray-900">{item.protocolo}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Status</div>
              <div className="font-medium">
                <span className={`px-2 py-1 text-xs rounded ${
                  item.status === 'finalizado' ? 'bg-green-100 text-green-800' :
                  item.status === 'em_analise' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {item.status === 'finalizado' ? 'Finalizado' :
                   item.status === 'em_analise' ? 'Em Análise' :
                   item.status === 'aguardando' ? 'Aguardando' :
                   'Pendente'}
                </span>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Data de Criação</div>
              <div className="font-medium text-gray-900">{formatDate(item.created_at)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Responsável</div>
              <div className="font-medium text-gray-900">{item.responsavel_profile?.full_name || item.responsavel || 'Não atribuído'}</div>
            </div>
          </div>
        </div>

        {/* Histórico de Procedimentos */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <p className="text-gray-600">Histórico de procedimentos em desenvolvimento...</p>
        </div>

        {/* Datas Importantes */}
        {(item.data_inicio || item.data_contato || item.data_finalizado) && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4 border-l-4 border-blue-600 pl-3">
              Datas Importantes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {item.data_inicio && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Data de Início</div>
                  <div className="font-medium text-gray-900">{formatDate(item.data_inicio)}</div>
                </div>
              )}
              {item.data_contato && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Data de Contato</div>
                  <div className="font-medium text-gray-900">{formatDate(item.data_contato)}</div>
                </div>
              )}
              {item.data_finalizado && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Data de Finalização</div>
                  <div className="font-medium text-gray-900">{formatDate(item.data_finalizado)}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Endereço */}
        {(item.endereco_bairro || item.endereco_cep || item.endereco_rua) && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 border-l-4 border-blue-600 pl-3 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-gray-500" />
              Endereço
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {item.endereco_bairro && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Bairro</div>
                  <div className="font-medium text-gray-900">{item.endereco_bairro}</div>
                </div>
              )}
              {item.endereco_cep && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">CEP</div>
                  <div className="font-medium text-gray-900">{item.endereco_cep}</div>
                </div>
              )}
              {item.endereco_rua && (
                <div className="md:col-span-2">
                  <div className="text-sm text-gray-500 mb-1">Rua</div>
                  <div className="font-medium text-gray-900">
                    {item.endereco_rua}{item.endereco_numero ? `, ${item.endereco_numero}` : ''}{item.endereco_complemento ? ` - ${item.endereco_complemento}` : ''}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Informações Adicionais */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 border-l-4 border-blue-600 pl-3">
            Informações Adicionais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Criado por</div>
              <div className="font-medium text-gray-900">{item.profiles?.full_name || 'Não definido'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Email do Criador</div>
              <div className="font-medium text-gray-900">{item.profiles?.email || 'Não definido'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Ponto de Contato</div>
              <div className="font-medium text-gray-900">{item.ponto_contato || 'Não definido'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Tipo</div>
              <div className="font-medium text-gray-900">{item.tipo === 'solicitacao' ? 'Solicitação' : 'Demanda'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
