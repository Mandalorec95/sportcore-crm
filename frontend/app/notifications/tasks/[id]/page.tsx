'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getTask, updateTask } from '@/lib/api';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatDateTime } from '@/lib/utils';
import { ArrowLeft, Calendar, CheckCircle, Clock, UserRound } from 'lucide-react';
import { toast } from 'sonner';

interface Person {
  id: string;
  fullName: string;
  role?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status: 'new' | 'in_progress' | 'completed' | 'done';
  priority: 'low' | 'medium' | 'high';
  createdAt?: string;
  updatedAt?: string;
  createdBy?: Person;
  assignedTo?: Person | null;
}

const statusLabels: Record<Task['status'], string> = {
  new: 'Новая',
  in_progress: 'В работе',
  completed: 'Выполнена',
  done: 'Выполнена',
};

const priorityLabels: Record<Task['priority'], string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
};

function isDone(status?: string) {
  return status === 'completed' || status === 'done';
}

export default function TaskDetailsPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const taskId = params.id;

  const { data: task, isLoading } = useQuery<Task>({
    queryKey: ['task', taskId],
    queryFn: () => getTask(taskId),
    enabled: Boolean(taskId),
  });

  const completeMutation = useMutation({
    mutationFn: () => updateTask(taskId, { status: 'completed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Задача выполнена');
    },
    onError: () => toast.error('Не удалось выполнить задачу'),
  });

  return (
    <MainLayout allowedRoles={['admin', 'coach', 'parent']}>
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <Link href="/notifications" className={`${buttonVariants({ variant: 'outline', size: 'sm' })} mb-4`}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          К уведомлениям
        </Link>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : !task ? (
          <div className="text-center text-gray-500 py-16">Задача не найдена</div>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle className="text-xl">{task.title}</CardTitle>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline">{statusLabels[task.status]}</Badge>
                    <Badge variant="outline">Приоритет: {priorityLabels[task.priority]}</Badge>
                  </div>
                </div>
                {!isDone(task.status) && (
                  <Button className="bg-green-600 hover:bg-green-700" onClick={() => completeMutation.mutate()} disabled={completeMutation.isPending}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {completeMutation.isPending ? 'Сохранение...' : 'Выполнено'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="text-xs font-medium uppercase text-gray-400">Описание</div>
                <p className="mt-1 text-sm text-gray-700">{task.description || 'Описание не указано'}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <UserRound className="h-4 w-4 text-gray-400" />
                  Создал: {task.createdBy?.fullName || '—'}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <UserRound className="h-4 w-4 text-gray-400" />
                  Исполнитель: {task.assignedTo?.fullName || '—'}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  Срок: {formatDate(task.dueDate)}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4 text-gray-400" />
                  Создана: {formatDateTime(task.createdAt)}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
