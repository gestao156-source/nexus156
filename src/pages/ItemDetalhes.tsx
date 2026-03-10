import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, FileText, User, MapPin, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { verificarAtraso } from '../utils/calculoDiasUteis';

interface ItemDetalhes {
  id: string;
  assunto: string;
  protocolo: string;
  status: string;
  data_inicio: string | null;
  data_contato: string | null;
  data_finalizado: string | null;
  observacoes: string;
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
  profiles?: {
    full_name: string;
    email: string;
  };
  responsavel_profile?: {
    full_name: string;
    email: string;
  };
}

export default function ItemDetalhes() {
  console.log('🚀 ItemDetalhes - Componente carregado!');
  
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  console.log('📍 Parâmetros:', { itemId, pathname: location.pathname, search: location.search });

  const [item, setItem] = useState<ItemDetalhes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determinar tipo (solicitacao/demanda) baseado na URL
  const getTipoFromPath = () => {
    const path = location.pathname;
    if (path.includes('solicitacoes')) return 'solicitacoes';
    if (path.includes('demandas')) return 'demandas';
    return 'todos'; // fallback
  };

  useEffect(() => {
    if (!itemId) {
      setError('ID do item não fornecido');
      setLoading(false);
      return;
    }

    fetchItemDetalhes();
  }, [itemId]);

  const fetchItemDetalhes = async () => {
    try {
      setLoading(true);
      setError(null);

      const tipo = getTipoFromPath();
      console.log('🔍 Buscando item:', { itemId, tipo });
      
      let query;

      if (tipo === 'todos') {
        // Tentar buscar em ambas as tabelas
        console.log('📋 Buscando em ambas as tabelas...');
        const [solResult, demResult] = await Promise.all([
          supabase
            .from('solicitacoes')
            .select(`
              *,
              profiles!inner(full_name, email)
            `)
            .eq('id', itemId)
            .single(),
          supabase
            .from('demandas')
            .select(`
              *,
              profiles!inner(full_name, email)
            `)
            .eq('id', itemId)
            .single()
        ]);

        console.log('📊 Resultados:', { solResult, demResult });

        let itemData = null;
        if (solResult.data && !solResult.error) {
          console.log('✅ Item encontrado em solicitacoes');
          itemData = { ...solResult.data, tipo: 'solicitacao' };
        } else if (demResult.data && !demResult.error) {
          console.log('✅ Item encontrado em demandas');
          itemData = { ...demResult.data, tipo: 'demanda' };
        } else {
          console.log('❌ Item não encontrado:', { solError: solResult.error, demError: demResult.error });
          setError('Item não encontrado');
          return;
        }

        // Buscar responsável separadamente se existir
        if (itemData.responsavel) {
          const { data: respData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', itemData.responsavel)
            .single();
          
          itemData.responsavel_profile = respData;
        }

        setItem(itemData);
      } else {
        // Buscar na tabela específica
        console.log(`📋 Buscando na tabela ${tipo}...`);
        query = await supabase
          .from(tipo)
          .select(`
            *,
            profiles!inner(full_name, email)
          `)
          .eq('id', itemId)
          .single();

        console.log('📊 Resultado query:', query);

        if (query.error) throw query.error;
        
        let itemData = { ...query.data, tipo: tipo === 'solicitacoes' ? 'solicitacao' : 'demanda' };
        
        // Buscar responsável separadamente se existir
        if (itemData.responsavel) {
          const { data: respData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', itemData.responsavel)
            .single();
          
          itemData.responsavel_profile = respData;
        }

        setItem(itemData);
      }
    } catch (err) {
      console.error('❌ Erro ao buscar detalhes do item:', err);
      setError('Erro ao carregar detalhes do item');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Não definida';
    const dateStr = date.split('T')[0];
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      aguardando: 'bg-yellow-100 text-yellow-800',
      em_analise: 'bg-blue-100 text-blue-800',
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
            </div>
          </div>
        </div>

        {/* Detalhes Principais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-gray-600" />
              Informações Gerais
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Protocolo:</span>
                <p className="font-medium text-gray-900">{item.protocolo}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Data de Criação:</span>
                <p className="font-medium text-gray-900">{formatDate(item.created_at)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Data de Contato:</span>
                <p className="font-medium text-gray-900">{formatDate(item.data_contato)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Data de Finalização:</span>
                <p className="font-medium text-gray-900">{formatDate(item.data_finalizado)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-gray-600" />
              Responsável e Contato
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Criado por:</span>
                <p className="font-medium text-gray-900">{item.profiles?.full_name || 'Não definido'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Email do Criador:</span>
                <p className="font-medium text-gray-900">{item.profiles?.email || 'Não definido'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Responsável:</span>
                <p className="font-medium text-gray-900">{item.responsavel_profile?.full_name || item.responsavel || 'Não definido'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Ponto de Contato:</span>
                <p className="font-medium text-gray-900">{item.ponto_contato || 'Não definido'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Endereço */}
        {(item.endereco_rua || item.endereco_bairro) && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-gray-600" />
              Endereço
            </h2>
            <div className="space-y-3">
              {item.endereco_rua && (
                <div>
                  <span className="text-sm text-gray-500">Rua:</span>
                  <p className="font-medium text-gray-900">
                    {item.endereco_rua}{item.endereco_numero && `, ${item.endereco_numero}`}
                  </p>
                </div>
              )}
              {item.endereco_bairro && (
                <div>
                  <span className="text-sm text-gray-500">Bairro:</span>
                  <p className="font-medium text-gray-900">{item.endereco_bairro}</p>
                </div>
              )}
              {item.endereco_localidade && (
                <div>
                  <span className="text-sm text-gray-500">Cidade:</span>
                  <p className="font-medium text-gray-900">{item.endereco_localidade}</p>
                </div>
              )}
              {item.endereco_cep && (
                <div>
                  <span className="text-sm text-gray-500">CEP:</span>
                  <p className="font-medium text-gray-900">{item.endereco_cep}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Observações */}
        {item.observacoes && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Observações</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{item.observacoes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
