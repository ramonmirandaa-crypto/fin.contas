import { useState } from 'react';
import { Bell, X, AlertTriangle, CheckCircle, Info, TrendingUp, Calendar, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/ui/Card';
import { Button } from '@/react-app/components/ui/Button';
import { formatDate, cn } from '@/react-app/utils';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionLabel?: string;
  actionUrl?: string;
  category: 'expense' | 'goal' | 'investment' | 'credit_card' | 'loan' | 'sync' | 'general';
}

interface NotificationCenterProps {
  notifications?: Notification[];
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
  onDeleteNotification?: (notificationId: string) => void;
  maxDisplay?: number;
}

const NOTIFICATION_ICONS = {
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
  error: X,
};

const NOTIFICATION_COLORS = {
  success: 'border-green-200 bg-green-50/50',
  warning: 'border-yellow-200 bg-yellow-50/50',
  info: 'border-blue-200 bg-blue-50/50',
  error: 'border-red-200 bg-red-50/50',
};

const CATEGORY_ICONS = {
  expense: TrendingUp,
  goal: Calendar,
  investment: TrendingUp,
  credit_card: CreditCard,
  loan: AlertTriangle,
  sync: CheckCircle,
  general: Info,
};

function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete 
}: { 
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const IconComponent = NOTIFICATION_ICONS[notification.type];
  const CategoryIcon = CATEGORY_ICONS[notification.category];
  
  const handleMarkAsRead = () => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <Card 
      className={cn(
        'transition-all duration-200 hover:shadow-md cursor-pointer',
        NOTIFICATION_COLORS[notification.type],
        !notification.isRead && 'border-l-4 border-l-emerald-500'
      )}
      onClick={handleMarkAsRead}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            'p-2 rounded-full flex-shrink-0',
            notification.type === 'success' && 'bg-green-100',
            notification.type === 'warning' && 'bg-yellow-100',
            notification.type === 'info' && 'bg-blue-100',
            notification.type === 'error' && 'bg-red-100'
          )}>
            <IconComponent className={cn(
              'w-4 h-4',
              notification.type === 'success' && 'text-green-600',
              notification.type === 'warning' && 'text-yellow-600',
              notification.type === 'info' && 'text-blue-600',
              notification.type === 'error' && 'text-red-600'
            )} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={cn(
                'font-medium text-sm',
                !notification.isRead ? 'text-gray-900' : 'text-gray-700'
              )}>
                {notification.title}
              </h4>
              <div className="flex items-center gap-1">
                <CategoryIcon className="w-3 h-3 text-gray-400" />
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                )}
              </div>
            </div>
            
            <p className={cn(
              'text-sm mb-2',
              !notification.isRead ? 'text-gray-700' : 'text-gray-600'
            )}>
              {notification.message}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {formatDate(notification.timestamp)}
              </span>
              
              {notification.actionLabel && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-6"
                >
                  {notification.actionLabel}
                </Button>
              )}
            </div>
          </div>
          
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
              className="text-gray-400 hover:text-red-600 flex-shrink-0"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function NotificationCenter({
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  maxDisplay = 10
}: NotificationCenterProps) {
  const [showAll, setShowAll] = useState(false);

  // Sample notifications if none provided
  const sampleNotifications: Notification[] = [
    {
      id: '1',
      type: 'warning',
      title: 'Meta de Poupança Atrasada',
      message: 'Sua meta de reserva de emergência está 15% atrasada. Considere aumentar sua contribuição mensal.',
      timestamp: new Date().toISOString(),
      isRead: false,
      category: 'goal',
      actionLabel: 'Ver Meta',
    },
    {
      id: '2',
      type: 'success',
      title: 'Sincronização Concluída',
      message: 'Suas transações bancárias foram sincronizadas com sucesso. 12 novas transações importadas.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      isRead: false,
      category: 'sync',
    },
    {
      id: '3',
      type: 'info',
      title: 'Gastos Mensais Aumentaram',
      message: 'Seus gastos com Alimentação aumentaram 23% comparado ao mês passado. Total: R$ 1.245,00.',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      category: 'expense',
      actionLabel: 'Ver Detalhes',
    },
    {
      id: '4',
      type: 'warning',
      title: 'Fatura do Cartão Vencendo',
      message: 'A fatura do seu cartão Nubank vence em 3 dias. Valor: R$ 2.348,90.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      isRead: false,
      category: 'credit_card',
      actionLabel: 'Pagar Agora',
    },
    {
      id: '5',
      type: 'success',
      title: 'Meta de Investimento Atingida',
      message: 'Parabéns! Você atingiu sua meta de investir R$ 1.000 este mês.',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      isRead: true,
      category: 'investment',
    },
  ];

  const displayNotifications = notifications.length > 0 ? notifications : sampleNotifications;
  const sortedNotifications = displayNotifications.sort((a, b) => {
    // Unread first, then by timestamp (newest first)
    if (a.isRead !== b.isRead) {
      return a.isRead ? 1 : -1;
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const visibleNotifications = showAll 
    ? sortedNotifications 
    : sortedNotifications.slice(0, maxDisplay);

  const unreadCount = sortedNotifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl relative">
                <Bell className="w-6 h-6 text-white" />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <CardTitle>Central de Notificações</CardTitle>
                <p className="text-sm text-gray-600">
                  {unreadCount > 0 
                    ? `${unreadCount} notificação${unreadCount > 1 ? 'ões' : ''} não lida${unreadCount > 1 ? 's' : ''}`
                    : 'Todas as notificações foram lidas'
                  }
                </p>
              </div>
            </div>
            
            {unreadCount > 0 && onMarkAllAsRead && (
              <Button
                variant="outline"
                onClick={onMarkAllAsRead}
                className="gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Marcar Todas como Lidas
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {visibleNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={onMarkAsRead}
            onDelete={onDeleteNotification}
          />
        ))}
      </div>

      {/* Show More/Less Button */}
      {sortedNotifications.length > maxDisplay && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setShowAll(!showAll)}
            className="gap-2"
          >
            {showAll ? 'Mostrar Menos' : `Ver Mais (${sortedNotifications.length - maxDisplay})`}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {displayNotifications.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma notificação</h3>
            <p className="text-gray-600">
              Quando houver atualizações importantes sobre suas finanças, elas aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
