'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markNotificationRead, deleteNotification } from '@/lib/api';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Bell, Info, AlertCircle, CheckCircle, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title?: string;
  message?: string;
  type?: string;
  isRead?: boolean;
  createdAt?: string;
}

function NotificationIcon({ type }: { type?: string }) {
  if (type === 'payment_debt') return <AlertCircle className="h-5 w-5 text-red-500" />;
  if (type === 'doc_expiring') return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  if (type === 'competition') return <CheckCircle className="h-5 w-5 text-blue-500" />;
  if (type === 'progress') return <CheckCircle className="h-5 w-5 text-green-500" />;
  return <Info className="h-5 w-5 text-blue-500" />;
}

const TYPE_LABELS: Record<string, string> = {
  payment_debt: 'Долг по оплате',
  doc_expiring: 'Истекает документ',
  training: 'Тренировка',
  competition: 'Соревнование',
  progress: 'Прогресс',
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => toast.error('Ошибка'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setDeleteId(null);
      toast.success('Уведомление удалено');
    },
    onError: () => toast.error('Ошибка при удалении'),
  });

  const markAllRead = () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    unreadIds.forEach((id) => markReadMutation.mutate(id));
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <MainLayout allowedRoles={['admin', 'coach']}>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Уведомления
              {unread > 0 && (
                <Badge className="bg-red-500 text-white text-xs ml-1">{unread}</Badge>
              )}
            </h1>
            <p className="text-gray-500 mt-1">Системные уведомления и оповещения</p>
          </div>
          {unread > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Прочитать все
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Нет уведомлений</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <Card
                key={n.id}
                className={`transition-colors ${!n.isRead ? 'border-blue-200 bg-blue-50' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      <NotificationIcon type={n.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-sm text-gray-900">
                          {n.title || 'Уведомление'}
                          {!n.isRead && (
                            <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {n.createdAt && (
                            <span className="text-xs text-gray-400">
                              {new Date(n.createdAt).toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                          {!n.isRead && (
                            <button
                              onClick={() => markReadMutation.mutate(n.id)}
                              className="p-1 rounded hover:bg-blue-100 text-blue-500"
                              title="Отметить прочитанным"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteId(n.id)}
                            className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                            title="Удалить"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      {n.type && (
                        <Badge variant="outline" className="text-xs mb-1">
                          {TYPE_LABELS[n.type] || n.type}
                        </Badge>
                      )}
                      {n.message && (
                        <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirm Dialog */}
        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Удалить уведомление?</DialogTitle></DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setDeleteId(null)}>Отмена</Button>
              <Button
                variant="destructive"
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
