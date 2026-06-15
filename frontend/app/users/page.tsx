'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, createUser, updateUser, deleteUser, generateUserPassword } from '@/lib/api';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Plus, Search, Lock, Edit, Trash2, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: string;
  demoPassword?: string | null;
  createdAt?: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Администратор',
  coach: 'Тренер',
  parent: 'Родитель',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  coach: 'bg-blue-100 text-blue-700',
  parent: 'bg-green-100 text-green-700',
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [accessUser, setAccessUser] = useState<UserRecord | null>(null);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [createRole, setCreateRole] = useState<'admin' | 'coach' | 'parent'>('coach');

  const { data: users = [], isLoading } = useQuery<UserRecord[]>({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreate(false);
      toast.success('Пользователь создан');
    },
    onError: () => toast.error('Ошибка при создании'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditUser(null);
      toast.success('Пользователь обновлён');
    },
    onError: () => toast.error('Ошибка при обновлении'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteId(null);
      toast.success('Пользователь удалён');
    },
    onError: () => toast.error('Ошибка при удалении'),
  });

  const genPasswordMutation = useMutation({
    mutationFn: (id: string) => generateUserPassword(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setNewPassword(data.password);
      toast.success('Новый пароль сгенерирован');
    },
    onError: () => toast.error('Ошибка'),
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      fullName: fd.get('fullName') as string,
      email: fd.get('email') as string,
      phone: (fd.get('phone') as string) || undefined,
      role: createRole,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editUser) return;
    const fd = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: editUser.id,
      data: {
        fullName: fd.get('fullName') as string,
        email: fd.get('email') as string,
        phone: (fd.get('phone') as string) || undefined,
      },
    });
  };

  const filtered = users.filter((u) => {
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone ?? '').toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  return (
    <MainLayout allowedRoles={['admin']}>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Участники системы</h1>
            <p className="text-gray-500 mt-1">Все пользователи: администраторы, тренеры, родители</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Добавить
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-48">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Поиск по имени, email, телефону..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select modal={false} value={roleFilter} onValueChange={(v) => setRoleFilter(v ?? 'all')}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Все роли" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все роли</SelectItem>
                  <SelectItem value="admin">Администраторы</SelectItem>
                  <SelectItem value="coach">Тренеры</SelectItem>
                  <SelectItem value="parent">Родители</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ФИО</TableHead>
                      <TableHead>Email / Логин</TableHead>
                      <TableHead>Телефон</TableHead>
                      <TableHead>Роль</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                          Пользователи не найдены
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.fullName}</TableCell>
                          <TableCell className="text-sm text-gray-600">{u.email}</TableCell>
                          <TableCell className="text-sm text-gray-600">{u.phone ?? '—'}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                              {ROLE_LABELS[u.role] ?? u.role}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => { setAccessUser(u); setNewPassword(null); setShowPassword(false); }}
                                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                                title="Доступ / пароль"
                              >
                                <Lock className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setEditUser(u)}
                                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                                title="Редактировать"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeleteId(u.id)}
                                className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                                title="Удалить"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Новый пользователь</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="fullName">ФИО *</Label>
                <Input id="fullName" name="fullName" required placeholder="Иванов Иван" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email (логин) *</Label>
                <Input id="email" name="email" type="email" required placeholder="user@example.com" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">Телефон</Label>
                <Input id="phone" name="phone" placeholder="+7 999 000 00 00" />
              </div>
              <div className="space-y-1">
                <Label>Роль</Label>
                <Select modal={false} value={createRole} onValueChange={(v) => setCreateRole(v as typeof createRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Администратор</SelectItem>
                    <SelectItem value="coach">Тренер</SelectItem>
                    <SelectItem value="parent">Родитель</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-gray-500">Логин и пароль будут сгенерированы автоматически.</p>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Отмена</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Создание...' : 'Создать'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Редактировать пользователя</DialogTitle></DialogHeader>
            {editUser && (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-1">
                  <Label>ФИО *</Label>
                  <Input name="fullName" required defaultValue={editUser.fullName} />
                </div>
                <div className="space-y-1">
                  <Label>Email</Label>
                  <Input name="email" type="email" defaultValue={editUser.email} />
                </div>
                <div className="space-y-1">
                  <Label>Телефон</Label>
                  <Input name="phone" defaultValue={editUser.phone ?? ''} />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setEditUser(null)}>Отмена</Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Access / Password Dialog */}
        <Dialog open={!!accessUser} onOpenChange={() => { setAccessUser(null); setNewPassword(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Доступ пользователя</DialogTitle></DialogHeader>
            {accessUser && (
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-700">{accessUser.fullName}</div>
                  <div className="text-xs text-gray-500">{ROLE_LABELS[accessUser.role] ?? accessUser.role}</div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Логин:</span>
                    <span className="font-mono font-medium">{accessUser.email}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Пароль:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">
                        {showPassword
                          ? (newPassword ?? accessUser.demoPassword ?? '••••••••')
                          : '••••••••'}
                      </span>
                      <button onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                {newPassword && (
                  <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700">
                    Новый пароль: <strong className="font-mono">{newPassword}</strong>
                    <div className="text-xs mt-1 text-green-600">Сохраните его — он больше не будет показан в открытом виде.</div>
                  </div>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => genPasswordMutation.mutate(accessUser.id)}
                  disabled={genPasswordMutation.isPending}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {genPasswordMutation.isPending ? 'Генерация...' : 'Сгенерировать новый пароль'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirm */}
        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Удалить пользователя?</DialogTitle></DialogHeader>
            <p className="text-gray-500 text-sm">Это действие нельзя отменить.</p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDeleteId(null)}>Отмена</Button>
              <Button
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
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
