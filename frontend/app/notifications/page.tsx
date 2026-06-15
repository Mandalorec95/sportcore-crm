'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markNotificationRead, deleteNotification, getTasks, createTask, updateTask, deleteTask } from '@/lib/api';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Bell, Info, AlertCircle, CheckCircle, Check, Trash2, Plus, Edit, ListTodo, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title?: string;
  message?: string;
  type?: string;
  isRead?: boolean;
  createdAt?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status: 'new' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
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

const TASK_STATUS_LABELS: Record<string, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  done: 'Выполнена',
};

const TASK_STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  done: 'bg-green-100 text-green-700',
};

const TASK_PRIORITY_LABELS: Record<string, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
};

const TASK_PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-orange-100 text-orange-600',
  high: 'bg-red-100 text-red-600',
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [deleteNotifId, setDeleteNotifId] = useState<string | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<Task['status']>('new');
  const [taskPriority, setTaskPriority] = useState<Task['priority']>('medium');
  const [editStatus, setEditStatus] = useState<Task['status']>('new');
  const [editPriority, setEditPriority] = useState<Task['priority']>('medium');

  const { data: notifications = [], isLoading: notifsLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: getNotifications,
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

  const deleteNotifMutation = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setDeleteNotifId(null);
      toast.success('Удалено');
    },
    onError: () => toast.error('Ошибка'),
  });

  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowCreateTask(false);
      toast.success('Задача создана');
    },
    onError: () => toast.error('Ошибка при создании'),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
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

  const markAllRead = () => {
    notifications.filter((n) => !n.isRead).forEach((n) => markReadMutation.mutate(n.id));
  };

  const handleCreateTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createTaskMutation.mutate({
      title: fd.get('title') as string,
      description: (fd.get('description') as string) || undefined,
      dueDate: (fd.get('dueDate') as string) || undefined,
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
        status: editStatus,
        priority: editPriority,
      },
    });
  };

  const cycleStatus = (task: Task) => {
    const next: Record<Task['status'], Task['status']> = {
      new: 'in_progress',
      in_progress: 'done',
      done: 'new',
    };
    updateTaskMutation.mutate({ id: task.id, data: { status: next[task.status] } });
  };

  const openEdit = (t: Task) => {
    setEditTask(t);
    setEditStatus(t.status);
    setEditPriority(t.priority);
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <MainLayout allowedRoles={['admin', 'coach']}>
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Уведомления и задачи</h1>

        <Tabs defaultValue="notifications">
          <TabsList className="mb-4">
            <TabsTrigger value="notifications" className="flex items-center gap-1.5">
              <Bell className="h-4 w-4" />
              Уведомления
              {unread > 0 && (
                <Badge className="bg-red-500 text-white text-xs ml-1 h-4 px-1">{unread}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-1.5">
              <ListTodo className="h-4 w-4" />
              Задачи и заметки
              {tasks.filter((t) => t.status !== 'done').length > 0 && (
                <Badge variant="outline" className="text-xs ml-1 h-4 px-1">
                  {tasks.filter((t) => t.status !== 'done').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-500">{notifications.length} уведомлений</p>
              {unread > 0 && (
                <Button variant="outline" size="sm" onClick={markAllRead}>
                  <Check className="h-4 w-4 mr-1" />
                  Прочитать все
                </Button>
              )}
            </div>
            {notifsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center text-gray-400 py-16">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Нет уведомлений</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <Card key={n.id} className={!n.isRead ? 'border-blue-200 bg-blue-50' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex-shrink-0">
                          <NotificationIcon type={n.type} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-medium text-sm text-gray-900">
                              {n.title ?? 'Уведомление'}
                              {!n.isRead && <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full" />}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {n.createdAt && (
                                <span className="text-xs text-gray-400">
                                  {new Date(n.createdAt).toLocaleDateString('ru-RU', {
                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                                  })}
                                </span>
                              )}
                              {!n.isRead && (
                                <button
                                  onClick={() => markReadMutation.mutate(n.id)}
                                  className="p-1 rounded hover:bg-blue-100 text-blue-500"
                                  title="Прочитано"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => setDeleteNotifId(n.id)}
                                className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          {n.type && (
                            <Badge variant="outline" className="text-xs mb-1">
                              {TYPE_LABELS[n.type] ?? n.type}
                            </Badge>
                          )}
                          {n.message && <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-500">{tasks.length} задач</p>
              <Button size="sm" onClick={() => { setShowCreateTask(true); setTaskStatus('new'); setTaskPriority('medium'); }}>
                <Plus className="h-4 w-4 mr-1" />
                Новая задача
              </Button>
            </div>
            {tasksLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center text-gray-400 py-16">
                <ListTodo className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Нет задач. Создайте первую задачу.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((t) => (
                  <Card key={t.id} className={t.status === 'done' ? 'opacity-60' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => cycleStatus(t)}
                          className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded-full border-2 transition-colors ${
                            t.status === 'done'
                              ? 'bg-green-500 border-green-500'
                              : t.status === 'in_progress'
                              ? 'border-yellow-400 bg-yellow-50'
                              : 'border-gray-300 hover:border-blue-400'
                          }`}
                          title="Сменить статус"
                        >
                          {t.status === 'done' && <Check className="h-3 w-3 text-white m-auto" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className={`font-medium text-sm ${t.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                {t.title}
                              </span>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${TASK_STATUS_COLORS[t.status]}`}>
                                  {TASK_STATUS_LABELS[t.status]}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${TASK_PRIORITY_COLORS[t.priority]}`}>
                                  {TASK_PRIORITY_LABELS[t.priority]}
                                </span>
                                {t.dueDate && (
                                  <span className="flex items-center gap-0.5 text-xs text-gray-500">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(t.dueDate).toLocaleDateString('ru-RU')}
                                  </span>
                                )}
                              </div>
                              {t.description && (
                                <p className="text-sm text-gray-500 mt-1">{t.description}</p>
                              )}
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => openEdit(t)}
                                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTaskId(t.id)}
                                className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Delete Notification */}
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

        {/* Create Task */}
        <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Новая задача</DialogTitle></DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="title">Название *</Label>
                <Input id="title" name="title" required placeholder="Напомнить родителю об оплате" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="description">Описание</Label>
                <Textarea id="description" name="description" placeholder="Детали задачи..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="dueDate">Срок</Label>
                  <Input id="dueDate" name="dueDate" type="date" />
                </div>
                <div className="space-y-1">
                  <Label>Приоритет</Label>
                  <Select modal={false} value={taskPriority} onValueChange={(v) => setTaskPriority(v as Task['priority'])}>
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
                <Select modal={false} value={taskStatus} onValueChange={(v) => setTaskStatus(v as Task['status'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Новая</SelectItem>
                    <SelectItem value="in_progress">В работе</SelectItem>
                    <SelectItem value="done">Выполнена</SelectItem>
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

        {/* Edit Task */}
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Срок</Label>
                    <Input name="dueDate" type="date" defaultValue={editTask.dueDate ? editTask.dueDate.split('T')[0] : ''} />
                  </div>
                  <div className="space-y-1">
                    <Label>Приоритет</Label>
                    <Select modal={false} value={editPriority} onValueChange={(v) => setEditPriority(v as Task['priority'])}>
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
                  <Select modal={false} value={editStatus} onValueChange={(v) => setEditStatus(v as Task['status'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Новая</SelectItem>
                      <SelectItem value="in_progress">В работе</SelectItem>
                      <SelectItem value="done">Выполнена</SelectItem>
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

        {/* Delete Task */}
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
