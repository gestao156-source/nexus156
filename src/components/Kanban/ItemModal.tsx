import { useState, useEffect } from 'react';
import { X, Calendar, User, MapPin, Trash } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { verificarAtraso } from '../../utils/calculoDiasUteis';
import Logger from '../../utils/logger';
import { ItemStatus } from '../../types/index';
import { atualizarCoordenadasSolicitacao, atualizarCoordenadasDemanda } from '../../services/geocodingService';
import { GeocodingService } from '../../services/geocoding';
import EnderecoForm from '../Endereco/EnderecoForm';
import HistoricoProcedimentos from '../Historico/HistoricoProcedimentos';
import { useAuth } from '../../contexts/AuthContext';

interface Item {
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
  // Campos de endereço
  endereco_rua?: string;
  endereco_numero?: string;
  endereco_bairro?: string;
  endereco_localidade?: string;
  endereco_cep?: string;
  endereco_complemento?: string;
  latitude?: number;
  longitude?: number;
  endereco_latitude?: number;
  endereco_longitude?: number;
}

interface ItemModalProps {
  type: 'solicitacoes' | 'demandas';
  item: Item | null;
  onClose: () => void;
  onSave: () => void;
  isViewMode?: boolean;
}

interface AssuntoPadrao {
  id: string;
  nome: string;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
}

interface PontoContato {
  id: string;
  nome: string;
}

export default function ItemModal({ type, item, onClose, onSave, isViewMode = false }: ItemModalProps) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);

  // Carregar perfis para o dropdown de responsável
  useEffect(() => {
    const loadProfiles = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');
      
      setProfiles(data || []);
    };

    loadProfiles();
  }, []);

  const [formData, setFormData] = useState({
    assunto: '',
    protocolo: '',
    status: 'aguardando' as ItemStatus,
    data_inicio: '',
    data_contato: '',
    data_finalizado: '',
    responsavel: '',
    ponto_contato: '',
    // Campos de endereço
    endereco_rua: '',
    endereco_numero: '',
    endereco_bairro: '',
    endereco_localidade: '',
    endereco_cep: '',
    endereco_complemento: '',
    endereco_regional: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    // Campo observacoes removido - substituído por histórico
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [assuntos, setAssuntos] = useState<AssuntoPadrao[]>([]);
  const [pontosContato, setPontosContato] = useState<PontoContato[]>([]);
  const [temEndereco, setTemEndereco] = useState(false);

  useEffect(() => {
    // Carregar assuntos e pontos de contato do Supabase
    const loadData = async () => {
      try {
        const [assuntosResult, pontosResult] = await Promise.all([
          supabase.from('assuntos_padrao').select('*').order('nome'),
          supabase.from('pontos_contato').select('*').order('nome')
        ]);
        
        setAssuntos(assuntosResult.data || []);
        setPontosContato(pontosResult.data || []);
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (item) {
      // Verificar se item tem endereço preenchido (qualquer campo relevante)
      const temEnderecoPreenchido = !!(
        item.endereco_rua || 
        item.endereco_numero || 
        item.endereco_bairro || 
        item.endereco_cep || 
        item.endereco_complemento ||
        item.endereco_localidade ||
        item.endereco_latitude ||
        item.endereco_longitude
      );
      setTemEndereco(temEnderecoPreenchido);
      
      setFormData({
        assunto: item.assunto,
        protocolo: item.protocolo,
        status: item.status,
        data_inicio: item.data_inicio ? item.data_inicio.split('T')[0] : '',
        data_contato: item.data_contato ? item.data_contato.split('T')[0] : '',
        data_finalizado: item.data_finalizado ? item.data_finalizado.split('T')[0] : '',
        responsavel: item.responsavel || '',
        ponto_contato: item.ponto_contato || '',
        // Campos de endereço
        endereco_rua: item.endereco_rua || '',
        endereco_numero: item.endereco_numero || '',
        endereco_bairro: item.endereco_bairro || '',
        endereco_localidade: item.endereco_localidade || '',
        endereco_cep: item.endereco_cep || '',
        endereco_complemento: item.endereco_complemento || '',
        endereco_regional: GeocodingService.buscarRegionalPorBairro(item.endereco_bairro || ''),
        latitude: item.endereco_latitude,
        longitude: item.endereco_longitude,
      });
    } else {
      // Criando novo item - responsável e datas automáticas
      const hoje = new Date().toISOString().split('T')[0];
      setTemEndereco(false); // Novo item não tem endereço por padrão
      setFormData({
        assunto: '',
        protocolo: '',
        status: 'aguardando' as ItemStatus,
        data_inicio: hoje,
        data_contato: hoje,
        data_finalizado: '',
        responsavel: user?.user_metadata?.full_name || user?.email || '', // Auto-fill com nome do usuário (em vez de ID)
        ponto_contato: '',
        // Campos de endereço
        endereco_rua: '',
        endereco_numero: '',
        endereco_bairro: '',
        endereco_localidade: '',
        endereco_cep: '',
        endereco_complemento: '',
        endereco_regional: '',
        latitude: undefined,
        longitude: undefined,
      });
    }
  }, [item, user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      // Dados comuns (NUNCA incluem user_id)
      const baseData = {
        assunto: formData.assunto,
        protocolo: formData.protocolo,
        status: formData.status,
        data_inicio: formData.data_inicio ? `${formData.data_inicio}T00:00:00` : null,
        data_contato: formData.data_contato ? `${formData.data_contato}T00:00:00` : null,
        data_finalizado: formData.data_finalizado ? `${formData.data_finalizado}T00:00:00` : null,
        responsavel: formData.responsavel,
        ponto_contato: formData.ponto_contato,
        // Campo observacoes removido - substituído por histórico de procedimentos
        // Campos de endereço - incluídos apenas se temEndereco for true
        ...(temEndereco ? {
          endereco_rua: formData.endereco_rua || null,
          endereco_numero: formData.endereco_numero || null,
          endereco_bairro: formData.endereco_bairro || null,
          endereco_localidade: formData.endereco_localidade || null,
          endereco_cep: formData.endereco_cep || null,
          endereco_complemento: formData.endereco_complemento || null,
          endereco_latitude: formData.latitude || null,
          endereco_longitude: formData.longitude || null,
        } : {
          endereco_rua: null,
          endereco_numero: null,
          endereco_bairro: null,
          endereco_localidade: null,
          endereco_cep: null,
          endereco_complemento: null,
          endereco_latitude: null,
          endereco_longitude: null,
        })
      };

      // UPDATE (sem user_id)
      if (item) {
        const { error } = await supabase
          .from(type)
          .update(baseData)
          .eq('id', item.id);

        if (error) throw error;
        
        // Geocodificar endereço se fornecido E se temEndereco for true
        if (temEndereco && formData.endereco_rua && formData.endereco_numero && formData.endereco_bairro) {
          try {
            if (type === 'solicitacoes') {
              await atualizarCoordenadasSolicitacao(item.id, formData.endereco_rua, formData.endereco_numero, formData.endereco_bairro);
            } else {
              await atualizarCoordenadasDemanda(item.id, formData.endereco_rua, formData.endereco_numero, formData.endereco_bairro);
            }
          } catch (geoError) {
            console.warn('⚠️ Erro no geocoding:', geoError);
            // Não falhar o salvamento se geocoding falhar
          }
        }
      }
      // ➕ INSERT (com user_id)
      else {
        const { data, error } = await supabase
          .from(type)
          .insert([
            {
              ...baseData,
              user_id: user.id,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        
        // Geocodificar endereço se fornecido E se temEndereco for true
        if (temEndereco && formData.endereco_rua && formData.endereco_numero && formData.endereco_bairro) {
          try {
            if (type === 'solicitacoes') {
              await atualizarCoordenadasSolicitacao(data.id, formData.endereco_rua, formData.endereco_numero, formData.endereco_bairro);
            } else {
              await atualizarCoordenadasDemanda(data.id, formData.endereco_rua, formData.endereco_numero, formData.endereco_bairro);
            }
          } catch (geoError) {
            console.warn('⚠️ Erro no geocoding:', geoError);
            // Não falhar o salvamento se geocoding falhar
          }
        }
      }

      onSave();
    } catch (err) {
      console.error(err);
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!item || !confirm('Tem certeza que deseja excluir este item?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from(type)
        .delete()
        .eq('id', item.id);

      if (error) throw error;
      onSave();
    } catch (err) {
      console.error(err);
      setError('Erro ao excluir. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
         onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
           onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {isViewMode ? 'Visualizar' : item ? 'Editar' : 'Adicionar'} {type === 'solicitacoes' ? 'Solicitação' : 'Demanda'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assunto
              </label>
              <select
                value={formData.assunto}
                onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isViewMode}
              >
                <option value="">Selecione um assunto...</option>
                {assuntos.map((assunto) => (
                  <option key={assunto.id} value={assunto.nome}>
                    {assunto.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Protocolo *
              </label>
              <input
                type="text"
                value={formData.protocolo}
                onChange={(e) => setFormData({ ...formData, protocolo: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isViewMode}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as ItemStatus })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isViewMode}
              >
                <option value="aguardando">Aguardando Análise</option>
                <option value="em_analise">Em Análise</option>
                <option value="finalizado">Finalizado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Início
              </label>
              <input
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                disabled={isViewMode}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Contato
              </label>
              <input
                type="date"
                value={formData.data_contato}
                onChange={(e) => setFormData({ ...formData, data_contato: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                disabled={isViewMode}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Finalização
              </label>
              <input
                type="date"
                value={formData.data_finalizado}
                onChange={(e) =>
                  setFormData({ ...formData, data_finalizado: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                disabled={isViewMode}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsável
              </label>
              <select
                value={formData.responsavel}
                onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isViewMode}
              >
                <option value="">Selecione um responsável...</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ponto de Contato
              </label>
              <select
                value={formData.ponto_contato}
                onChange={(e) => setFormData({ ...formData, ponto_contato: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isViewMode}
              >
                <option value="">Selecione um ponto...</option>
                {pontosContato.map((ponto) => (
                  <option key={ponto.id} value={ponto.nome}>
                    {ponto.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Histórico de Procedimentos
              </label>
              <HistoricoProcedimentos
                itemId={item?.id || ''}
                itemTipo={type === 'solicitacoes' ? 'solicitacao' : 'demanda'}
                disabled={isViewMode}
              />
            </div>
          </div>

          {/* Seção de Endereço */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">📍 Endereço da Solicitação</h3>
              {!isViewMode && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={temEndereco}
                    onChange={(e) => setTemEndereco(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Adicionar endereço</span>
                </label>
              )}
            </div>
            
            {temEndereco && (
              <EnderecoForm
                value={{
                  cep: formData.endereco_cep,
                  rua: formData.endereco_rua,
                  numero: formData.endereco_numero,
                  bairro: formData.endereco_bairro,
                  localidade: formData.endereco_localidade,
                  complemento: formData.endereco_complemento,
                  regional: formData.endereco_regional,
                  latitude: formData.latitude,
                  longitude: formData.longitude
                }}
                onChange={(endereco) => {
                  setFormData({
                    ...formData,
                    endereco_rua: endereco.rua || '',
                    endereco_numero: endereco.numero || '',
                    endereco_bairro: endereco.bairro || '',
                    endereco_localidade: endereco.localidade || '',
                    endereco_cep: endereco.cep || '',
                    endereco_complemento: endereco.complemento || '',
                    endereco_regional: endereco.regional || '',
                    latitude: endereco.latitude,
                    longitude: endereco.longitude
                  });
                }}
                disabled={isViewMode}
                showMap={true}
              />
            )}
            
            {!temEndereco && (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-sm">
                  {isViewMode ? 'Esta solicitação não possui endereço cadastrado.' : 'Marque "Adicionar endereço" para incluir localização nesta solicitação.'}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div>
              {item && !isViewMode && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center space-x-2 text-red-600 hover:text-red-700 font-medium"
                >
                  <Trash className="w-5 h-5" />
                  <span>Excluir</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                {isViewMode ? 'Fechar' : 'Cancelar'}
              </button>
              {!isViewMode && (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
