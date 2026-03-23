import { Bell } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

interface NotificationBadgeProps {
  className?: string;
}

export default function NotificationBadge({ className = '' }: NotificationBadgeProps) {
  const { unreadCount, notifications, loading } = useNotifications();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/notifications');
  };

  // Mostrar loading state
  if (loading) {
    return (
      <button className={`relative p-2 text-gray-600 hover:text-gray-900 transition-colors ${className}`}>
        <Bell className="w-5 h-5" />
        <div className="absolute top-1 right-1 w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`relative p-2 text-gray-600 hover:text-gray-900 transition-colors ${className}`}
      title={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
    >
      <Bell className="w-5 h-5" />
      
      {/* Badge de contagem */}
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full border-2 border-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
      
      {/* Indicador de notificações recentes (sem contagem) */}
      {unreadCount === 0 && notifications.length > 0 && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
      )}
    </button>
  );
}
