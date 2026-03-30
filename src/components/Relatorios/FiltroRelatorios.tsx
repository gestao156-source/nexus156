import { useState, useEffect } from 'react';
import { Filter, Calendar, Users, FileText, RotateCcw } from 'lucide-react';
import { FiltrosType, getResponsaveisDisponiveis } from '../../hooks/useRelatoriosData';

interface FiltroRelatoriosProps {
  filtros: FiltrosType;
  onFiltroChange: (filtro: string, valor: string | string[] | Record<string, unknown>) => void;
  onLimparFiltros: () => void;
  isAdmin: boolean;
}

const STATUS_OPTIONS = [
  { value: 'aguardando', label: 'Aguardando Análise' },
  { value: 'em_analise', label: 'Em Análise' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'atrasado', label: 'Atrasado' },
];

const TIPO_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'solicitacoes', label: 'Solicitações' },
  { value: 'demandas', label: 'Demandas' },
];

export default function FiltroRelatorios({ 
  filtros, 
  onFiltroChange, 
  onLimparFiltros, 
  isAdmin 
}: FiltroRelatoriosProps) {
  const [responsaveisDisponiveis, setResponsaveisDisponiveis] = useState<string[]>([]);

  useEffect(() => {
    carregarResponsaveis();
  }, []);

  const carregarResponsaveis = async () => {
    try {
      const responsaveis = await getResponsaveisDisponiveis();
      setResponsaveisDisponiveis(responsaveis);
    } catch (error) {
      console.error('Erro ao carregar responsáveis:', error);
    }
  };

  const handleStatusChange = (status: string, checked: boolean) => {
    const novosStatus = checked
      ? [...filtros.status, status]
      : filtros.status.filter(s => s !== status);
    
    onFiltroChange('status', novosStatus);
  };

  const handleResponsavelChange = (responsavel: string, checked: boolean) => {
    const novosResponsaveis = checked
      ? [...filtros.responsaveis, responsavel]
      : filtros.responsaveis.filter(r => r !== responsavel);
    
    onFiltroChange('responsaveis', novosResponsaveis);
  };

  const handlePeriodoChange = (campo: 'inicio' | 'fim', valor: string) => {
    onFiltroChange('periodo', {
      ...filtros.periodo,
      [campo]: valor,
    });
  };

  const limparTodosFiltros = () => {
    onLimparFiltros();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        </div>
        
        <button
          onClick={limparTodosFiltros}
          className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-gray-50 text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Limpar Filtros</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Período */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <h4 className="font-medium text-gray-900">Período</h4>
          </div>
          
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Data Início
              </label>
              <input
                type="date"
                value={filtros.periodo.inicio}
                onChange={(e) => handlePeriodoChange('inicio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                value={filtros.periodo.fim}
                onChange={(e) => handlePeriodoChange('fim', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Tipo */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <h4 className="font-medium text-gray-900">Tipo de Item</h4>
          </div>
          
          <div className="space-y-2">
            {TIPO_OPTIONS.map(tipo => (
              <label key={tipo.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipo"
                  value={tipo.value}
                  checked={filtros.tipo === tipo.value}
                  onChange={(e) => onFiltroChange('tipo', e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900">{tipo.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <h4 className="font-medium text-gray-900">Status</h4>
          </div>
          
          <div className="space-y-2">
            {STATUS_OPTIONS.map(status => (
              <label key={status.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtros.status.includes(status.value)}
                  onChange={(e) => handleStatusChange(status.value, e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900">{status.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Responsáveis */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-500" />
            <h4 className="font-medium text-gray-900">Responsáveis</h4>
          </div>
          
          <div className="max-h-32 overflow-y-auto space-y-1">
            {responsaveisDisponiveis.map(responsavel => (
              <label key={responsavel} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtros.responsaveis.includes(responsavel)}
                  onChange={(e) => handleResponsavelChange(responsavel, e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900">{responsavel}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Filtro de Usuário (apenas para admins) */}
        {isAdmin && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-gray-500" />
              <h4 className="font-medium text-gray-900">Escopo de Usuário</h4>
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="usuario"
                  value="proprios"
                  checked={filtros.usuario === 'proprios'}
                  onChange={(e) => onFiltroChange('usuario', e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900">Meus itens</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="usuario"
                  value="todos"
                  checked={filtros.usuario === 'todos'}
                  onChange={(e) => onFiltroChange('usuario', e.target.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900">Todos os itens</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Resumo dos Filtros Ativos */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-2">
          {filtros.periodo.inicio && (
            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
              Período: {filtros.periodo.inicio} a {filtros.periodo.fim || 'hoje'}
            </span>
          )}
          
          {filtros.tipo !== 'todos' && (
            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
              Tipo: {filtros.tipo}
            </span>
          )}
          
          {filtros.status.length > 0 && (
            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
              {filtros.status.length} status selecionados
            </span>
          )}
          
          {filtros.responsaveis.length > 0 && (
            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
              {filtros.responsaveis.length} responsáveis
            </span>
          )}
          
          {isAdmin && filtros.usuario === 'todos' && (
            <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-full">
              Visão de administrador
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

