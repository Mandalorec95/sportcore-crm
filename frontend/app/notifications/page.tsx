'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createNotification,
  createTask,
  deleteNotification,
  deleteTask,
  getNotificationRecipients,
  getNotifications,
  getTasks,
  markNotificationRead,
  updateTask,
} from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  Bell,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  Edit,
  Info,
  ListTodo,
  Plus,
  Search,
  Send,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, formatDateTime } from '@/lib/utils';

interface Person {
  id: string;
  fullName: string;
  role?: 'admin' | 'coach' | 'parent';
  email?: string;
}

interface Notification {
  id: string;
  title?: string;
  message?: string;
  type?: string;
  isRead?: boolean;
  createdAt?: string;
  sender?: Person | null;
  recipient?: Person | null;
  relatedTaskId?: string | null;
  link?: string | null;
}

interface NotificationCreateResult extends Notification {
  count?: number;
  notifications?: Notification[];
}

interface Task {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status: 'new' | 'in_progress' | 'completed' | 'done';
  priority: 'low' | 'medium' | 'high';
  createdAt?: string;
  createdBy?: Person;
  assignedTo?: Person | null;
  assignedToId?: string | null;
}

type NotificationFilter = 'all' | 'unread' | 'read' | 'tasks' | 'danger' | 'warning' | 'success';
type NotificationSort = 'default' | 'newest' | 'oldest' | 'unread_first' | 'read_first' | 'importance' | 'kind';
type NotificationTone = 'success' | 'warning' | 'danger';

const roleLabels: Record<string, string> = {
  admin: 'Администратор',
  coach: 'Тренер',
  parent: 'Родитель',
};

const toneLabels: Record<NotificationTone, string> = {
  success: 'Зелёное',
  warning: 'Жёлтое',
  danger: 'Красное',
};

const toneStyles: Record<NotificationTone, { stripe: string; bg: string; icon: string; badge: string; dot: string }> = {
  success: {
    stripe: 'bg-green-500',
    bg: 'bg-green-50 border-green-200',
    icon: 'text-green-600',
    badge: 'bg-green-100 text-green-700 border-green-200',
    dot: 'bg-green-500',
  },
  warning: {
    stripe: 'bg-yellow-500',
    bg: 'bg-yellow-50 border-yellow-200',
    icon: 'text-yellow-600',
    badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    dot: 'bg-yellow-500',
  },
  danger: {
    stripe: 'bg-red-500',
    bg: 'bg-red-50 border-red-200',
    icon: 'text-red-600',
    badge: 'bg-red-100 text-red-700 border-red-200',
    dot: 'bg-red-500',
  },
};

const legacyTypeLabels: Record<string, string> = {
  payment_debt: 'Долг по оплате',
  doc_expiring: 'Истекает документ',
  training: 'Тренировка',
  competition: 'Соревнование',
  progress: 'Прогресс',
  competition_approval: 'Допуск к соревнованию',
};

const taskStatusLabels: Record<Task['status'], string> = {
  new: 'Новая',
  in_progress: 'В работе',
  completed: 'Выполнена',
  done: 'Выполнена',
};

const taskPriorityLabels: Record<Task['priority'], string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
};

function getTone(type?: string): NotificationTone {
  if (type === 'success' || type === 'progress') return 'success';
  if (type === 'danger' || type === 'payment_debt' || type === 'doc_expiring') return 'danger';
  return 'warning';
}

function getTypeLabel(notification: Notification) {
  if (notification.relatedTaskId || notification.link?.includes('/notifications/tasks/')) return 'Задача';
  if (notification.type === 'success' || notification.type === 'warning' || notification.type === 'danger') {
    return toneLabels[notification.type];
  }
  return legacyTypeLabels[notification.type ?? ''] ?? 'Уведомление';
}

function getNotificationIcon(type?: string) {
  const tone = getTone(type);
  if (tone === 'success') return CheckCircle;
  if (tone === 'danger') return AlertCircle;
  return Info;
}

function normalizeSearch(value?: string | null) {
  return (value ?? '').toLocaleLowerCase('ru-RU').trim();
}

function isTaskDone(status: Task['status']) {
  return status === 'completed' || status === 'done';
}

function notificationImportance(notification: Notification) {
  const tone = getTone(notification.type);
  if (tone === 'danger') return 0;
  if (tone === 'warning') return 1;
  return 2;
}

const filters: Array<{ value: NotificationFilter; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'unread', label: 'Непрочитанные' },
  { value: 'read', label: 'Прочитанные' },
  { value: 'tasks', label: 'Задачи' },
  { value: 'danger', label: 'Красные' },
  { value: 'warning', label: 'Жёлтые' },
  { value: 'success', label: 'Зелёные' },
];

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const canCreateNotification = currentUser?.role === 'admin' || currentUser?.role === 'coach';
  const [deleteNotifId, setDeleteNotifId] = useState<string | null>(null);
  const [showCreateNotification, setShowCreateNotification] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [notificationTone, setNotificationTone] = useState<NotificationTone>('warning');
  const [notificationRecipientId, setNotificationRecipientId] = useState('');
  const [taskStatus, setTaskStatus] = useState<Task['status']>('new');
  const [taskPriority, setTaskPriority] = useState<Task['priority']>('medium');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [editStatus, setEditStatus] = useState<Task['status']>('new');
  const [editPriority, setEditPriority] = useState<Task['priority']>('medium');
  const [editAssigneeId, setEditAssigneeId] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [sort, setSort] = useState<NotificationSort>('default');

  const { data: notifications = [], isLoading: notifsLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    refetchInterval: 15000,
  });

  const { data: recipients = [] } = useQuery<Person[]>({
    queryKey: ['notification-recipients'],
    queryFn: getNotificationRecipients,
    enabled: canCreateNotification,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: getTasks,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: () => toast.error('Ошибка'),
  });

  const createNotifMutation = useMutation({
    mutationFn: createNotification,
    onSuccess: (result: NotificationCreateResult) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setShowCreateNotification(false);
      setNotificationRecipientId('');
      const notification = result.notifications?.[0] ?? result;
      const description = result.count
        ? `Отправлено получателей: ${result.count}`
        : notification.message;
      const tone = getTone(notification.type);
      if (tone === 'success') toast.success(notification.title || 'Уведомление отправлено', { description });
      else if (tone === 'danger') toast.error(notification.title || 'Уведомление отправлено', { description });
      else toast.warning(notification.title || 'Уведомление отправлено', { description });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Ошибка при отправке уведомления'),
  });

  const deleteNotifMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setDeleteNotifId(null);
      toast.success('Уведомление удалено');
    },
    onError: () => toast.error('Ошибка'),
  });

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setShowCreateTask(false);
      setTaskAssigneeId('');
      toast.success('Задача создана');
    },
    onError: () => toast.error('Ошибка при создании'),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setEditTask(null);
      toast.success('Задача обновлена');
    },
    onError: () => toast.error('Ошибка'),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setDeleteTaskId(null);
      toast.success('Задача удалена');
    },
    onError: () => toast.error('Ошибка'),
  });

  const unread = notifications.filter((n) => !n.isRead).length;
  const activeTasks = tasks.filter((t) => !isTaskDone(t.status)).length;

  const filteredNotifications = useMemo(() => {
    const q = normalizeSearch(search);
    const result = notifications.filter((notification) => {
      const tone = getTone(notification.type);
      const isTaskNotification = Boolean(notification.relatedTaskId || notification.link?.includes('/notifications/tasks/'));
      if (filter === 'unread' && notification.isRead) return false;
      if (filter === 'read' && !notification.isRead) return false;
      if (filter === 'tasks' && !isTaskNotification) return false;
      if ((filter === 'success' || filter === 'warning' || filter === 'danger') && tone !== filter) return false;

      if (!q) return true;
      const text = [
        notification.title,
        notification.message,
        notification.sender?.fullName,
        notification.recipient?.fullName,
      ].map(normalizeSearch).join(' ');
      return text.includes(q);
    });

    return result.sort((a, b) => {
      if (sort === 'newest') return Date.parse(b.createdAt || '') - Date.parse(a.createdAt || '');
      if (sort === 'oldest') return Date.parse(a.createdAt || '') - Date.parse(b.createdAt || '');
      if (sort === 'read_first') return Number(b.isRead) - Number(a.isRead) || Date.parse(b.createdAt || '') - Date.parse(a.createdAt || '');
      if (sort === 'importance') return notificationImportance(a) - notificationImportance(b) || Date.parse(b.createdAt || '') - Date.parse(a.createdAt || '');
      if (sort === 'kind') {
        const aTask = Number(Boolean(a.relatedTaskId || a.link?.includes('/notifications/tasks/')));
        const bTask = Number(Boolean(b.relatedTaskId || b.link?.includes('/notifications/tasks/')));
        return bTask - aTask || Date.parse(b.createdAt || '') - Date.parse(a.createdAt || '');
      }
      return Number(a.isRead) - Number(b.isRead) || Date.parse(b.createdAt || '') - Date.parse(a.createdAt || '');
    });
  }, [filter, notifications, search, sort]);

  const markAllRead = () => {
    notifications.filter((n) => !n.isRead).forEach((n) => markReadMutation.mutate(n.id));
  };

  const handleCreateNotification = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createNotifMutation.mutate({
      recipientId: notificationRecipientId,
      title: fd.get('title') as string,
      message: fd.get('message') as string,
      type: notificationTone,
    });
  };

  const handleCreateTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createTaskMutation.mutate({
      title: fd.get('title') as string,
      description: (fd.get('description') as string) || undefined,
      dueDate: (fd.get('dueDate') as string) || undefined,
      assignedToUserId: taskAssigneeId || undefined,
      status: taskStatus,
      priority: taskPriority,
    });
  };

  const handleUpdateTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editTask) return;
    const fd = new FormData(e.currentTarget);
    updateTaskMutation.mutate({
      id: editTask.id,
      data: {
        title: fd.get('title') as string,
        description: (fd.get('description') as string) || undefined,
        dueDate: (fd.get('dueDate') as string) || undefined,
        assignedToUserId: editAssigneeId || undefined,
        status: editStatus,
        priority: editPriority,
      },
    });
  };

  const completeTask = (task: Task) => {
    updateTaskMutation.mutate({ id: task.id, data: { status: 'completed' } });
  };

  const openEdit = (task: Task) => {
    setEditTask(task);
    setEditStatus(task.status === 'done' ? 'completed' : task.status);
    setEditPriority(task.priority);
    setEditAssigneeId(task.assignedTo?.id || task.assignedToId || '');
  };

  return (
    <MainLayout allowedRoles={['admin', 'coach', 'parent']}>
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Уведомления и задачи</h1>
          <p className="text-gray-500 mt-1">Сообщения, напоминания и назначенные действия</p>
        </div>

        <Tabs defaultValue="notifications">
          <TabsList className="mb-4">
            <TabsTrigger value="notifications" className="flex items-center gap-1.5">
              <Bell className="h-4 w-4" />
              Уведомления
              {unread > 0 && <Badge className="bg-red-500 text-white text-xs ml-1 h-4 px-1">{unread}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-1.5">
              <ListTodo className="h-4 w-4" />
              Задачи
              {activeTasks > 0 && <Badge variant="outline" className="text-xs ml-1 h-4 px-1">{activeTasks}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications">
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Поиск по заголовку, тексту, отправителю или получателю..."
                      className="pl-9"
                    />
                  </div>
                  <Select modal={false} value={sort} onValueChange={(v) => setSort((v ?? 'default') as NotificationSort)}>
                    <SelectTrigger className="w-full lg:w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Сначала непрочитанные</SelectItem>
                      <SelectItem value="newest">Сначала новые</SelectItem>
                      <SelectItem value="oldest">Сначала старые</SelectItem>
                      <SelectItem value="read_first">Сначала прочитанные</SelectItem>
                      <SelectItem value="importance">По важности</SelectItem>
                      <SelectItem value="kind">Сначала задачи</SelectItem>
                    </SelectContent>
                  </Select>
                  {unread > 0 && (
                    <Button variant="outline" onClick={markAllRead} className="lg:w-auto">
                      <Check className="h-4 w-4 mr-1" />
                      Прочитать все
                    </Button>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {filters.map((item) => (
                    <button
                      key={item.value}
                      onClick={() => setFilter(item.value)}
                      className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                        filter === item.value
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {notifsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center text-gray-400 py-16">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>{notifications.length === 0 ? 'Нет уведомлений' : 'Ничего не найдено'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => {
                  const tone = getTone(notification.type);
                  const styles = toneStyles[tone];
                  const Icon = getNotificationIcon(notification.type);
                  const taskHref = notification.link || (notification.relatedTaskId ? `/notifications/tasks/${notification.relatedTaskId}` : '');

                  return (
                    <Card key={notification.id} className={`overflow-hidden border ${!notification.isRead ? styles.bg : 'bg-white'}`}>
                      <CardContent className="p-0">
                        <div className="flex">
                          <div className={`w-1.5 flex-shrink-0 ${styles.stripe}`} />
                          <div className="flex-1 p-4">
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 rounded-full bg-white p-2 ${styles.icon}`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h2 className="text-sm font-semibold text-gray-900">{notification.title || 'Уведомление'}</h2>
                                      {!notification.isRead && <span className={`h-2 w-2 rounded-full ${styles.dot}`} />}
                                    </div>
                                    {notification.message && (
                                      <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
                                    <Badge variant="outline" className={`text-xs ${styles.badge}`}>{toneLabels[tone]}</Badge>
                                    <Badge variant="outline" className="text-xs">{getTypeLabel(notification)}</Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {notification.isRead ? 'Прочитано' : 'Не прочитано'}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="mt-3 flex flex-col gap-2 text-xs text-gray-500 md:flex-row md:flex-wrap md:items-center">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />
                                    {formatDateTime(notification.createdAt)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <UserRound className="h-3.5 w-3.5" />
                                    От: {notification.sender?.fullName || 'Система'}
                                  </span>
                                  <span>Кому: {notification.recipient?.fullName || 'Вы'}</span>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                  {taskHref && (
                                    <Link href={taskHref} className={buttonVariants({ size: 'sm', variant: 'outline' })}>
                                      Перейти к задаче
                                    </Link>
                                  )}
                                  {!notification.isRead && (
                                    <Button size="sm" variant="outline" onClick={() => markReadMutation.mutate(notification.id)}>
                                      <Check className="h-4 w-4 mr-1" />
                                      Отметить прочитанным
                                    </Button>
                                  )}
                                  <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => setDeleteNotifId(notification.id)}>
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Удалить
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tasks">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">{tasks.length} задач</p>
              {canCreateNotification && (
                <Button size="sm" onClick={() => { setShowCreateTask(true); setTaskStatus('new'); setTaskPriority('medium'); setTaskAssigneeId(''); }}>
                  <Plus className="h-4 w-4 mr-1" />
                  Новая задача
                </Button>
              )}
            </div>

            {tasksLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center text-gray-400 py-16">
                <ListTodo className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Нет задач</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <Card key={task.id} className={isTaskDone(task.status) ? 'opacity-70' : ''}>
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className={`text-sm font-semibold ${isTaskDone(task.status) ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                              {task.title}
                            </h2>
                            <Badge variant="outline">{taskStatusLabels[task.status]}</Badge>
                            <Badge variant="outline">{taskPriorityLabels[task.priority]}</Badge>
                          </div>
                          {task.description && <p className="mt-1 text-sm text-gray-600">{task.description}</p>}
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                            {task.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(task.dueDate)}
                              </span>
                            )}
                            <span>Создал: {task.createdBy?.fullName || '—'}</span>
                            <span>Исполнитель: {task.assignedTo?.fullName || '—'}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {!isTaskDone(task.status) && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => completeTask(task)}>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Выполнено
                            </Button>
                          )}
                          <Link href={`/notifications/tasks/${task.id}`} className={buttonVariants({ size: 'sm', variant: 'outline' })}>
                            Открыть
                          </Link>
                          {canCreateNotification && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => openEdit(task)}>
                                <Edit className="h-4 w-4 mr-1" />
                                Изменить
                              </Button>
                              <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => setDeleteTaskId(task.id)}>
                                <Trash2 className="h-4 w-4 mr-1" />
                                Удалить
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {canCreateNotification && (
          <button
            onClick={() => setShowCreateNotification(true)}
            className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
            aria-label="Создать уведомление"
          >
            <Plus className="h-7 w-7" />
          </button>
        )}

        <Dialog open={showCreateNotification} onOpenChange={setShowCreateNotification}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Создать уведомление</DialogTitle></DialogHeader>
            <form onSubmit={handleCreateNotification} className="space-y-4">
              <div className="space-y-1">
                <Label>Получатель уведомления *</Label>
                <Select modal={false} value={notificationRecipientId} onValueChange={(v) => setNotificationRecipientId(v ?? '')}>
                  <SelectTrigger><SelectValue placeholder="Выберите получателя" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все пользователи платформы</SelectItem>
                    {recipients.map((recipient) => (
                      <SelectItem key={recipient.id} value={recipient.id}>
                        {recipient.fullName} · {roleLabels[recipient.role || ''] || recipient.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="notificationTitle">Заголовок *</Label>
                <Input id="notificationTitle" name="title" required placeholder="Напоминание об оплате" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="notificationMessage">Текст уведомления *</Label>
                <Textarea id="notificationMessage" name="message" required placeholder="Коротко опишите сообщение..." rows={4} />
              </div>
              <div className="space-y-1">
                <Label>Тип / цвет уведомления</Label>
                <Select modal={false} value={notificationTone} onValueChange={(v) => setNotificationTone((v ?? 'warning') as NotificationTone)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="success">Зелёное — успех или хорошая новость</SelectItem>
                    <SelectItem value="warning">Жёлтое — напоминание или информация</SelectItem>
                    <SelectItem value="danger">Красное — срочно или проблема</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateNotification(false)}>
                  <X className="h-4 w-4 mr-1" />
                  Отмена
                </Button>
                <Button type="submit" disabled={createNotifMutation.isPending || !notificationRecipientId}>
                  <Send className="h-4 w-4 mr-1" />
                  {createNotifMutation.isPending ? 'Отправка...' : 'Отправить'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteNotifId} onOpenChange={() => setDeleteNotifId(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Удалить уведомление?</DialogTitle></DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setDeleteNotifId(null)}>Отмена</Button>
              <Button variant="destructive" onClick={() => deleteNotifId && deleteNotifMutation.mutate(deleteNotifId)} disabled={deleteNotifMutation.isPending}>
                Удалить
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Новая задача</DialogTitle></DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="title">Название *</Label>
                <Input id="title" name="title" required placeholder="Позвонить родителю" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="description">Описание</Label>
                <Textarea id="description" name="description" placeholder="Детали задачи..." rows={3} />
              </div>
              <div className="space-y-1">
                <Label>Исполнитель</Label>
                <Select modal={false} value={taskAssigneeId} onValueChange={(v) => setTaskAssigneeId(v ?? '')}>
                  <SelectTrigger><SelectValue placeholder="По умолчанию вы" /></SelectTrigger>
                  <SelectContent>
                    {recipients.map((recipient) => (
                      <SelectItem key={recipient.id} value={recipient.id}>
                        {recipient.fullName} · {roleLabels[recipient.role || ''] || recipient.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="dueDate">Срок</Label>
                  <Input id="dueDate" name="dueDate" type="date" />
                </div>
                <div className="space-y-1">
                  <Label>Приоритет</Label>
                  <Select modal={false} value={taskPriority} onValueChange={(v) => setTaskPriority((v ?? 'medium') as Task['priority'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Низкий</SelectItem>
                      <SelectItem value="medium">Средний</SelectItem>
                      <SelectItem value="high">Высокий</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Статус</Label>
                <Select modal={false} value={taskStatus} onValueChange={(v) => setTaskStatus((v ?? 'new') as Task['status'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Новая</SelectItem>
                    <SelectItem value="in_progress">В работе</SelectItem>
                    <SelectItem value="completed">Выполнена</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateTask(false)}>Отмена</Button>
                <Button type="submit" disabled={createTaskMutation.isPending}>
                  {createTaskMutation.isPending ? 'Создание...' : 'Создать'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editTask} onOpenChange={() => setEditTask(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Редактировать задачу</DialogTitle></DialogHeader>
            {editTask && (
              <form onSubmit={handleUpdateTask} className="space-y-4">
                <div className="space-y-1">
                  <Label>Название *</Label>
                  <Input name="title" required defaultValue={editTask.title} />
                </div>
                <div className="space-y-1">
                  <Label>Описание</Label>
                  <Textarea name="description" defaultValue={editTask.description ?? ''} rows={3} />
                </div>
                <div className="space-y-1">
                  <Label>Исполнитель</Label>
                  <Select modal={false} value={editAssigneeId} onValueChange={(v) => setEditAssigneeId(v ?? '')}>
                    <SelectTrigger><SelectValue placeholder="Без исполнителя" /></SelectTrigger>
                    <SelectContent>
                      {recipients.map((recipient) => (
                        <SelectItem key={recipient.id} value={recipient.id}>
                          {recipient.fullName} · {roleLabels[recipient.role || ''] || recipient.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Срок</Label>
                    <Input name="dueDate" type="date" defaultValue={editTask.dueDate ? editTask.dueDate.split('T')[0] : ''} />
                  </div>
                  <div className="space-y-1">
                    <Label>Приоритет</Label>
                    <Select modal={false} value={editPriority} onValueChange={(v) => setEditPriority((v ?? 'medium') as Task['priority'])}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Низкий</SelectItem>
                        <SelectItem value="medium">Средний</SelectItem>
                        <SelectItem value="high">Высокий</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Статус</Label>
                  <Select modal={false} value={editStatus} onValueChange={(v) => setEditStatus((v ?? 'new') as Task['status'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Новая</SelectItem>
                      <SelectItem value="in_progress">В работе</SelectItem>
                      <SelectItem value="completed">Выполнена</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setEditTask(null)}>Отмена</Button>
                  <Button type="submit" disabled={updateTaskMutation.isPending}>
                    {updateTaskMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteTaskId} onOpenChange={() => setDeleteTaskId(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Удалить задачу?</DialogTitle></DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setDeleteTaskId(null)}>Отмена</Button>
              <Button variant="destructive" onClick={() => deleteTaskId && deleteTaskMutation.mutate(deleteTaskId)} disabled={deleteTaskMutation.isPending}>
                Удалить
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
