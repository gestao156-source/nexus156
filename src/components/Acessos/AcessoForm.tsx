import { useState, useEffect } from 'react';
import { Acesso, AcessoStatus } from '../../types/index';
import HistoricoProcedimentos from '../Historico/HistoricoProcedimentos';
import HistoricoProcedimentosTemporario from '../Historico/HistoricoProcedimentosTemporario';

interface AcessoFormProps {
  acesso?: Acesso | null;
  onSave: (acesso: Partial<Acesso>) => void;
  onCancel: () => void;
}

export default function AcessoForm({ acesso, onSave, onCancel }: AcessoFormProps) {
  const [formData, setFormData] = useState({
    solicitante_wpp: '',
    servidor_beneficiado: '',
    data_solicitacao: '',
    data_criacao_acesso: '',
    regional: '',
    setor: '',
    status: 'solicitado' as AcessoStatus,
    responsavel_nexus: '',
    observacoes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [procedimentosIniciais, setProcedimentosIniciais] = useState<string[]>([]);
  const [statusOriginal, setStatusOriginal] = useState<AcessoStatus | null>(null);

  useEffect(() => {
    if (acesso) {
      setFormData({
        solicitante_wpp: acesso.solicitante_wpp || '',
        servidor_beneficiado: acesso.servidor_beneficiado || '',
        data_solicitacao: acesso.data_solicitacao || '',
        data_criacao_acesso: acesso.data_criacao_acesso || '',
        regional: acesso.regional || '',
        setor: acesso.setor || '',
        status: acesso.status || 'solicitado',
        responsavel_nexus: acesso.responsavel_nexus || '',
        observacoes: acesso.observacoes || ''
      });
      setStatusOriginal(acesso.status || 'solicitado');
    } else {
      // Novo acesso: definir data atual como padrão
      const hoje = new Date().toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        data_solicitacao: hoje,
        data_criacao_acesso: hoje
      }));
    }
  }, [acesso]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.solicitante_wpp.trim()) {
      newErrors.solicitante_wpp = 'Campo obrigatório';
    }

    if (!formData.servidor_beneficiado.trim()) {
      newErrors.servidor_beneficiado = 'Campo obrigatório';
    }

    if (!formData.data_solicitacao) {
      newErrors.data_solicitacao = 'Campo obrigatório';
    }

    if (formData.data_criacao_acesso && formData.data_solicitacao) {
      if (new Date(formData.data_criacao_acesso) < new Date(formData.data_solicitacao)) {
        newErrors.data_criacao_acesso = 'Data de criação não pode ser anterior à data de solicitação';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const dataToSave: Partial<Acesso> = {
      ...formData,
      id: acesso?.id,
      data_criacao_acesso: formData.data_criacao_acesso || undefined,
      procedimentos_iniciais: procedimentosIniciais
    };

    onSave(dataToSave);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const statusOptions: AcessoStatus[] = ['solicitado', 'em_andamento', 'criado', 'ativo', 'desativado'];

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Solicitante (WhatsApp) *
            </label>
            <input
              type="text"
              value={formData.solicitante_wpp}
              onChange={(e) => handleChange('solicitante_wpp', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.solicitante_wpp ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nome de quem solicitou"
            />
            {errors.solicitante_wpp && (
              <p className="text-red-500 text-sm mt-1">{errors.solicitante_wpp}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Servidor Beneficiado *
            </label>
            <input
              type="text"
              value={formData.servidor_beneficiado}
              onChange={(e) => handleChange('servidor_beneficiado', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.servidor_beneficiado ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Servidor que receberá acesso"
            />
            {errors.servidor_beneficiado && (
              <p className="text-red-500 text-sm mt-1">{errors.servidor_beneficiado}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data da Solicitação *
            </label>
            <input
              type="date"
              value={formData.data_solicitacao}
              onChange={(e) => handleChange('data_solicitacao', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.data_solicitacao ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.data_solicitacao && (
              <p className="text-red-500 text-sm mt-1">{errors.data_solicitacao}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Criação do Acesso
            </label>
            <input
              type="date"
              value={formData.data_criacao_acesso}
              onChange={(e) => handleChange('data_criacao_acesso', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.data_criacao_acesso ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.data_criacao_acesso && (
              <p className="text-red-500 text-sm mt-1">{errors.data_criacao_acesso}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Regional
            </label>
            <input
              type="text"
              value={formData.regional}
              onChange={(e) => handleChange('regional', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Regional do servidor"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Setor
            </label>
            <input
              type="text"
              value={formData.setor}
              onChange={(e) => handleChange('setor', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Setor do servidor"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
            {acesso && statusOriginal && formData.status !== statusOriginal && (
              <p className="text-xs text-orange-600 mt-1 flex items-center">
                <span className="w-2 h-2 bg-orange-500 rounded-full mr-1"></span>
                Status alterado - será registrado no histórico
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Responsável NEXUS
            </label>
            <input
              type="text"
              value={formData.responsavel_nexus}
              onChange={(e) => handleChange('responsavel_nexus', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Quem está gerenciando no NEXUS"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {acesso ? 'Salvar' : 'Criar'} Acesso
          </button>
        </div>

        {/* Histórico de Procedimentos - sempre visível */}
        <div className="border-t pt-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Histórico de Procedimentos</h3>
          </div>
          
          {acesso ? (
            <HistoricoProcedimentos
              itemId={acesso.id}
              itemTipo="acesso"
              disabled={false}
            />
          ) : (
            <HistoricoProcedimentosTemporario
              onProcedimentosChange={setProcedimentosIniciais}
            />
          )}
        </div>
      </form>
    </div>
  );
}
