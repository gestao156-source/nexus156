import { useState, useEffect } from 'react';
import { X, Search, FileText, User, Phone, Calendar, AlertTriangle, Clock } from 'lucide-react';
import { KanbanItem } from '../../types/index';
import { verificarAtraso } from '../../utils/calculoDiasUteis';
import { useHistoricoProcedimentos } from '../../hooks/useHistoricoProcedimentos';

interface DashboardItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: KanbanItem[];
  status: string;
  isLoading?: boolean;
  onItemClick: (item: KanbanItem) => void;
}

export default function DashboardItemModal({ 
  isOpen, 
  onClose, 
  items, 
  status, 
  isLoading = false,
  onItemClick 
}: DashboardItemModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);

  useEffect(() => {
    setFilteredItems(items);
  }, [items]);

  // Adicionar evento de tecla ESC para fechar o modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = items.filter(item =>
        item.assunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.protocolo.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems(items);
    }
  }, [searchTerm, items]);

  const formatDate = (date: string | null) => {
    if (!date) return null;
    const dateStr = date.split('T')[0];
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleItemClick = (item: KanbanItem) => {
    onItemClick(item);
    onClose();
  };

  const getModalBehavior = () => {
    if (items.length === 0) return 'empty';
    if (items.length <= 3) return 'compact';
    return 'search';
  };

  const behavior = getModalBehavior();

  // Se não tiver itens, não abre modal
  if (behavior === 'empty') {
    return null;
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
         onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
           onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isLoading && (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Carregando dados...</span>
                </div>
              )}
              {!isLoading && (
                `${filteredItems.length} ${
                  status.includes('assunto_') 
                    ? `Assunto: ${status.replace('assunto_', '')}`
                    : status.includes('resumo_')
                    ? status.replace('resumo_', '').replace('_', ' ').charAt(0).toUpperCase() + status.replace('resumo_', '').replace('_', ' ').slice(1)
                    : status.includes('prioridade_')
                    ? `Prioridade: ${status.replace('prioridade_', '')}`
                    : status === 'aguardando' ? 'Aguardando Análise' : 
                    status === 'em_analise' ? 'Em Análise' : 
                    status === 'finalizado' ? 'Finalizados' : status
                }`
              )}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search (apenas para muitos itens) */}
        {behavior === 'search' && (
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar itens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Carregando itens...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Nenhum item encontrado</p>
              <p className="text-sm text-gray-400">
                {status.includes('assunto_') 
                  ? `Não há itens correspondentes a este assunto no momento.`
                  : 'Não há itens disponíveis para este filtro.'
                }
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filteredItems.map((item) => {
                const estaAtrasado = verificarAtraso(item.status, item.data_contato);
                
                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                      estaAtrasado 
                        ? 'bg-red-50 border-red-300' 
                        : 'bg-white border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {/* Header do Item */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-gray-900 flex-1">{item.assunto}</h4>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            {item.tipo === 'solicitacao' ? 'Solicitação' : 'Demanda'}
                          </span>
                        </div>
                      </div>
                      {estaAtrasado ? (
                        <div className="flex items-center space-x-1 bg-red-100 px-2 py-1 rounded-full">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          <span className="text-xs font-semibold text-red-700">Atrasado</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Detalhes do Item */}
                    <div className="space-y-1 text-xs text-gray-600 mb-3">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-3 h-3" />
                        <span>Protocolo: {item.protocolo || 'N/A'}</span>
                      </div>
                      {item.responsavel && (
                        <div className="flex items-center space-x-2">
                          <User className="w-3 h-3" />
                          <span>Responsável: {item.responsavel}</span>
                        </div>
                      )}
                      {item.ponto_contato && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-3 h-3" />
                          <span>Contato: {item.ponto_contato}</span>
                        </div>
                      )}
                    </div>

                    {/* Datas */}
                    <div className="space-y-1 text-xs text-gray-600">
                      {item.data_contato && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-3 h-3" />
                          <span>Contato: {formatDate(item.data_contato)}</span>
                        </div>
                      )}
                    </div>

                    {/* Último Procedimento */}
                    {(() => {
                      const { getUltimoProcedimento, formatarData } = useHistoricoProcedimentos({
                        itemId: item.id,
                        itemTipo: item.tipo === 'solicitacao' ? 'solicitacao' : 'demanda'
                      });
                      const ultimoProcedimento = getUltimoProcedimento();
                      
                      return ultimoProcedimento ? (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-start space-x-2">
                            <Clock className="w-3 h-3 text-gray-500 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-600 line-clamp-2">
                                {ultimoProcedimento.procedimento}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {ultimoProcedimento.usuario_nome} • {formatarData(ultimoProcedimento.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}

                    {/* Indicador de clique */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-blue-600 font-medium">Clique para ver detalhes →</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{filteredItems.length} de {items.length} itens</span>
            <button
              onClick={onClose}
              className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
