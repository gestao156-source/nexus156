import { useState } from 'react';
import { ArrowLeft, Filter, RefreshCw, Settings, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { useToast } from '../contexts/ToastContext';
import NotificationItem from '../components/Notifications/NotificationItem';
import NotificationCenter from '../components/Notifications/NotificationCenter';
import { NotificationStatus, NotificationType } from '../types';

export default function NotificationsPage() {
  const navigate = useNavigate();
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

  const [showCenter, setShowCenter] = useState(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                Notificações
                {unreadCount > 0 && (
                  <span className="ml-2 text-sm text-blue-600">
                    ({unreadCount} não lidas)
                  </span>
                )}
              </h1>
            </div>

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

              {/* Settings button */}
              <button
                onClick={() => setShowCenter(true)}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                title="Configurações"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Status filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filter.status}
                onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value as any }))}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="flex items-center space-x-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Marcar todas como lidas</span>
              </button>
            )}

            {/* Clear filters */}
            {(filter.status !== 'all' || filter.type !== 'all') && (
              <button
                onClick={() => setFilter({ status: 'all', type: 'all' })}
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Carregando notificações...</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-12 text-red-600">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Filter className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-center mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && filteredNotifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Filter className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter.status !== 'all' || filter.type !== 'all' 
                ? 'Nenhuma notificação encontrada'
                : 'Nenhuma notificação'
              }
            </h3>
            <p className="text-center text-gray-600 mb-4">
              {filter.status !== 'all' || filter.type !== 'all' 
                ? 'Tente ajustar os filtros para ver mais notificações.'
                : 'Você não tem notificações no momento.'
              }
            </p>
            {(filter.status !== 'all' || filter.type !== 'all') && (
              <button
                onClick={() => setFilter({ status: 'all', type: 'all' })}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {!loading && !error && filteredNotifications.length > 0 && (
          <div>
            <div className="mb-4 text-sm text-gray-600">
              {filteredNotifications.length} notificação{filteredNotifications.length !== 1 ? 's' : ''}
              {filter.status !== 'all' || filter.type !== 'all' && ' (filtradas)'}
            </div>
            
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Notification Center Modal */}
      <NotificationCenter 
        isOpen={showCenter} 
        onClose={() => setShowCenter(false)} 
      />
    </div>
  );
}
