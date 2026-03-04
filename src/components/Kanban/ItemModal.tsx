import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ItemStatus } from '../../types';

interface Item {
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
}

interface ItemModalProps {
  type: 'solicitacoes' | 'demandas';
  item: Item | null;
  onClose: () => void;
  onSave: () => void;
}

interface AssuntoPadrao {
  id: string;
  nome: string;
}

interface PontoContato {
  id: string;
  nome: string;
}

export default function ItemModal({ type, item, onClose, onSave }: ItemModalProps) {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    assunto: '',
    protocolo: '',
    status: 'aguardando' as ItemStatus,
    data_inicio: '',
    data_contato: '',
    data_finalizado: '',
    observacoes: '',
    responsavel: '',
    ponto_contato: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [assuntos, setAssuntos] = useState<AssuntoPadrao[]>([]);
  const [pontosContato, setPontosContato] = useState<PontoContato[]>([]);

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
        console.error('Erro ao carregar dados:', error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (item) {
      setFormData({
        assunto: item.assunto,
        protocolo: item.protocolo,
        status: item.status,
        data_inicio: item.data_inicio ? item.data_inicio.split('T')[0] : '',
        data_contato: item.data_contato ? item.data_contato.split('T')[0] : '',
        data_finalizado: item.data_finalizado ? item.data_finalizado.split('T')[0] : '',
        observacoes: item.observacoes,
        responsavel: item.responsavel || '',
        ponto_contato: item.ponto_contato || '',
      });
    } else {
      // Criando novo item - responsável automático
      setFormData({
        assunto: '',
        protocolo: '',
        status: 'aguardando' as ItemStatus,
        data_inicio: '',
        data_contato: '',
        data_finalizado: '',
        observacoes: '',
        responsavel: user?.id || '', // ✅ Automático!
        ponto_contato: '',
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

      // 🔹 Dados comuns (NUNCA incluem user_id)
      const baseData = {
        assunto: formData.assunto,
        protocolo: formData.protocolo,
        status: formData.status,
        data_inicio: formData.data_inicio ? `${formData.data_inicio}T00:00:00` : null,
        data_contato: formData.data_contato ? `${formData.data_contato}T00:00:00` : null,
        data_finalizado: formData.data_finalizado ? `${formData.data_finalizado}T00:00:00` : null,
        observacoes: formData.observacoes,
        responsavel: formData.responsavel,
        ponto_contato: formData.ponto_contato,
      };

      // 🔁 UPDATE (sem user_id)
      if (item) {
        const { error } = await supabase
          .from(type)
          .update(baseData)
          .eq('id', item.id);

        if (error) throw error;
      }
      // ➕ INSERT (com user_id)
      else {
        const { error } = await supabase
          .from(type)
          .insert([
            {
              ...baseData,
              user_id: user.id,
            },
          ]);

        if (error) throw error;
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {item ? 'Editar' : 'Adicionar'} {type === 'solicitacoes' ? 'Solicitação' : 'Demanda'}
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
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsável
              </label>
              <input
                type="text"
                value={formData.responsavel}
                onChange={(e) =>
                  setFormData({ ...formData, responsavel: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
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
                Observações
              </label>
              <textarea
                value={formData.observacoes}
                onChange={(e) =>
                  setFormData({ ...formData, observacoes: e.target.value })
                }
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div>
              {item && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center space-x-2 text-red-600 hover:text-red-700 font-medium"
                >
                  <Trash2 className="w-5 h-5" />
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
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
