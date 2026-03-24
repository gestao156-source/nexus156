import { useState } from 'react';
import { X, ExternalLink, Clock, CheckCircle, AlertTriangle, Info, Bell } from 'lucide-react';
import { Notification } from '../../types';
import { useNotifications } from '../../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationItemProps {
  notification: Notification;
  onAction?: () => void;
}

export default function NotificationItem({ notification, onAction }: NotificationItemProps) {
  const { markAsRead } = useNotifications();
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);

  const getIcon = () => {
    switch (notification.type) {
      case 'new_item':
        return <Bell className="w-4 h-4 text-blue-600" />;
      case 'status_change':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'deadline_warning':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'deadline_passed':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'assignment':
        return <Info className="w-4 h-4 text-purple-600" />;
      case 'system_alert':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50';
      case 'low':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-gray-500 bg-white';
    }
  };

  const getTypeLabel = () => {
    switch (notification.type) {
      case 'new_item':
        return 'Novo Item';
      case 'status_change':
        return 'Mudança de Status';
      case 'deadline_warning':
        return 'Aviso de Prazo';
      case 'deadline_passed':
        return 'Prazo Ultrapassado';
      case 'assignment':
        return 'Atribuição';
      case 'comment':
        return 'Comentário';
      case 'system_alert':
        return 'Alerta do Sistema';
      case 'reminder':
        return 'Lembrete';
      case 'summary':
        return 'Resumo';
      default:
        return 'Notificação';
    }
  };

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.status === 'unread' && !isMarkingAsRead) {
      setIsMarkingAsRead(true);
      await markAsRead(notification.id);
      setIsMarkingAsRead(false);
    }
  };

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.action_url) {
      window.open(notification.action_url, '_blank');
    }
    if (onAction) {
      onAction();
    }
  };

  const isUnread = notification.status === 'unread';
  const createdDate = new Date(notification.created_at);

  return (
    <div
      className={`
        relative p-4 border-l-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer
        ${getPriorityColor()}
        ${isUnread ? 'font-semibold' : ''}
      `}
      onClick={handleMarkAsRead}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          {getIcon()}
          <span className="text-xs text-gray-500 uppercase tracking-wide">
            {getTypeLabel()}
          </span>
          {isUnread && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
              Novo
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          {/* Botão de marcar como lida */}
          {isUnread && (
            <button
              onClick={handleMarkAsRead}
              disabled={isMarkingAsRead}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="Marcar como lida"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          
          {/* Botão de fechar */}
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="mb-2">
        <h4 className="text-sm font-medium text-gray-900 mb-1">
          {notification.title}
        </h4>
        {notification.message && (
          <p className="text-sm text-gray-600">
            {notification.message}
          </p>
        )}
      </div>

      {/* Metadata adicional (se houver) */}
      {notification.metadata && Object.keys(notification.metadata).length > 0 && (
        <div className="mb-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
          {notification.metadata.protocolo && (
            <div>Protocolo: {notification.metadata.protocolo}</div>
          )}
          {notification.metadata.old_status && (
            <div>Status: {notification.metadata.old_status} → {notification.metadata.new_status}</div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {formatDistanceToNow(createdDate, { 
            addSuffix: true, 
            locale: ptBR 
          })}
        </div>
        
        {/* Botão de ação */}
        {notification.action_url && notification.action_text && (
          <button
            onClick={handleAction}
            className="flex items-center space-x-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <span>{notification.action_text}</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Indicador de prioridade urgente */}
      {notification.priority === 'urgent' && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
      )}
    </div>
  );
}
