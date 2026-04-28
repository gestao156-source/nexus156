import { Calendar, FileText, User, Phone, Edit, AlertTriangle } from 'lucide-react';
import { KanbanItem } from '../../types/index';
import { usePermissions } from '../../hooks/usePermissions';
import { verificarAtraso } from '../../utils/calculoDiasUteis';

interface KanbanCardProps {
  item: KanbanItem;
  onEdit: (item: KanbanItem) => void;
  onView: (item: KanbanItem) => void;
  responsavelName?: string;
}

export default function KanbanCard({ item, onEdit, onView, responsavelName }: KanbanCardProps) {
  const { canEdit } = usePermissions();
  const canEditItem = canEdit(item);
  
  // Verificar se o item está atrasado
  const estaAtrasado = verificarAtraso(item.status, item.data_contato);

  const formatDate = (date: string | null) => {
    if (!date) return null;
    const dateStr = date.split('T')[0];
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleEdit = () => {
    if (!canEditItem) return;
    onEdit(item);
  };

  const handleView = () => {
    onView(item);
  };

  const handleClick = () => {
    if (canEditItem) {
      handleEdit();
    } else {
      handleView();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`p-4 rounded-lg shadow-sm border transition-all relative ${
        estaAtrasado 
          ? 'bg-red-50 border-red-300 animate-pulse' 
          : 'bg-white border-gray-200'
      } ${
        canEditItem 
          ? 'hover:shadow-md cursor-pointer' 
          : 'hover:shadow-md cursor-pointer border-gray-100 opacity-90'
      }`}
    >
      {/* Indicador de atraso */}
      {estaAtrasado > 0 ? (
        <div className="absolute top-2 right-2 flex items-center space-x-1 bg-red-100 px-2 py-1 rounded-full">
          <AlertTriangle className="w-3 h-3 text-red-600" />
          <span className="text-xs font-semibold text-red-700">Atrasado ({estaAtrasado} dias)</span>
        </div>
      ) : null}
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900 flex-1">{item.assunto}</h4>
        <div className="flex items-center space-x-1">
          {canEditItem ? (
            <Edit className="w-3 h-3 text-blue-600" />
          ) : (
            <Edit className="w-3 h-3 text-gray-400" />
          )}
        </div>
      </div>

      <div className="space-y-1 text-xs text-gray-600 mb-3">
        <div className="flex items-center space-x-2">
          <FileText className="w-3 h-3" />
          <span>Protocolo: {item.protocolo}</span>
        </div>
        {item.responsavel && (
          <div className="flex items-center space-x-2">
            <User className="w-3 h-3" />
            <span>Responsável: {responsavelName || item.responsavel}</span>
          </div>
        )}
        {item.ponto_contato && (
          <div className="flex items-center space-x-2">
            <Phone className="w-3 h-3" />
            <span>Contato: {item.ponto_contato}</span>
          </div>
        )}
      </div>

      <div className="space-y-1 text-xs text-gray-600">
        {item.data_inicio && (
          <div className="flex items-center space-x-2">
            <Calendar className="w-3 h-3" />
            <span>Início: {formatDate(item.data_inicio)}</span>
          </div>
        )}
        {item.data_contato && (
          <div className="flex items-center space-x-2">
            <Calendar className="w-3 h-3" />
            <span>Contato: {formatDate(item.data_contato)}</span>
          </div>
        )}
        {item.data_finalizado && (
          <div className="flex items-center space-x-2">
            <Calendar className="w-3 h-3" />
            <span>Finalizado: {formatDate(item.data_finalizado)}</span>
          </div>
        )}
      </div>

      {/* Indicador de histórico */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-blue-600 font-medium">Clique para ver histórico completo →</p>
      </div>

      {!canEditItem && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 italic">Clique para visualizar detalhes</p>
        </div>
      )}
    </div>
  );
}
