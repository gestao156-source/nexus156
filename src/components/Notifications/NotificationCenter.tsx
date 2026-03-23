import { useState, useEffect } from 'react';
import { X, CheckSquare, Filter, RefreshCw, Settings } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useToast } from '../../contexts/ToastContext';
import NotificationItem from './NotificationItem';
import { NotificationStatus, NotificationType } from '../../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error, 
    markAllAsRead, 
    refreshNotifications 
  } = useNotifications();
  const { showSuccess, showError } = useToast();

  const [filter, setFilter] = useState<{
    status: NotificationStatus | 'all';
    type: NotificationType | 'all';
  }>({
    status: 'all',
    type: 'all'
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filtrar notificações
  const filteredNotifications = notifications.filter(notification => {
    const statusMatch = filter.status === 'all' || notification.status === filter.status;
    const typeMatch = filter.type === 'all' || notification.type === filter.type;
    return statusMatch && typeMatch;
  });

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshNotifications();
      showSuccess('Notificações atualizadas');
    } catch (err) {
      showError('Erro ao atualizar notificações');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      showSuccess('Todas as notificações marcadas como lidas');
    } catch (err) {
      showError('Erro ao marcar notificações como lidas');
    }
  };

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Centro de Notificações
            {unreadCount > 0 && (
              <span className="ml-2 text-sm text-blue-600">
                ({unreadCount} não lidas)
              </span>
            )}
          </h2>
          
          <div className="flex items-center space-x-2">
            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Atualizar"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-wrap items-center gap-4">
            {/* Status filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filter.status}
                onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value as any }))}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos os status</option>
                <option value="unread">Não lidas</option>
                <option value="read">Lidas</option>
                <option value="archived">Arquivadas</option>
              </select>
            </div>

            {/* Type filter */}
            <div className="flex items-center space-x-2">
              <select
                value={filter.type}
                onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value as any }))}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos os tipos</option>
                <option value="new_item">Novos itens</option>
                <option value="status_change">Mudanças de status</option>
                <option value="deadline_warning">Avisos de prazo</option>
                <option value="deadline_passed">Prazos ultrapassados</option>
                <option value="assignment">Atribuições</option>
                <option value="system_alert">Alertas do sistema</option>
              </select>
            </div>

            {/* Actions */}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Marcar todas como lidas</span>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Carregando notificações...</span>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center p-8 text-red-600">
              <X className="w-12 h-12 mb-2" />
              <p className="text-center">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {!loading && !error && filteredNotifications.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Filter className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-center">
                {filter.status !== 'all' || filter.type !== 'all' 
                  ? 'Nenhuma notificação encontrada com os filtros selecionados'
                  : 'Nenhuma notificação encontrada'
                }
              </p>
              {(filter.status !== 'all' || filter.type !== 'all') && (
                <button
                  onClick={() => setFilter({ status: 'all', type: 'all' })}
                  className="mt-4 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          )}

          {!loading && !error && filteredNotifications.length > 0 && (
            <div className="p-4 space-y-3">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onAction={() => {
                    // Fechar o centro após clicar em uma ação
                    setTimeout(onClose, 300);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              {filteredNotifications.length} notificação{filteredNotifications.length !== 1 ? 's' : ''}
              {filter.status !== 'all' || filter.type !== 'all' && ' (filtradas)'}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setFilter({ status: 'all', type: 'all' })}
                className="text-blue-600 hover:text-blue-700 transition-colors"
              >
                Limpar filtros
              </button>
              <button className="text-gray-500 hover:text-gray-700 transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
