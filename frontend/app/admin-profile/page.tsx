'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMyProfile, changeMyPassword } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Mail, Phone, Shield, Lock, Save } from 'lucide-react';
import { toast } from 'sonner';
import { clearAuth, setAuth, getToken } from '@/lib/auth';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Администратор',
  coach: 'Тренер',
  parent: 'Родитель',
};

export default function AdminProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);

  const profileMutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (updated) => {
      if (user) {
        const token = getToken();
        if (token) setAuth(token, { ...user, ...updated });
        window.location.reload();
      }
      setEditingProfile(false);
      toast.success('Профиль обновлён');
    },
    onError: () => toast.error('Ошибка при обновлении профиля'),
  });

  const passwordMutation = useMutation({
    mutationFn: (newPassword: string) => changeMyPassword(newPassword),
    onSuccess: () => {
      setEditingPassword(false);
      toast.success('Пароль изменён. Войдите заново.');
      setTimeout(() => {
        clearAuth();
        window.location.href = '/login';
      }, 1500);
    },
    onError: () => toast.error('Ошибка при смене пароля'),
  });

  const handleProfileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    profileMutation.mutate({
      fullName: fd.get('fullName') as string,
      email: fd.get('email') as string,
      phone: (fd.get('phone') as string) || undefined,
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newPassword = fd.get('newPassword') as string;
    const confirm = fd.get('confirmPassword') as string;
    if (newPassword !== confirm) {
      toast.error('Пароли не совпадают');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Пароль должен быть не короче 6 символов');
      return;
    }
    passwordMutation.mutate(newPassword);
  };

  if (!user) return null;

  return (
    <MainLayout>
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Личный кабинет</h1>
          <p className="text-gray-500 mt-1">Ваш профиль и настройки</p>
        </div>

        {/* Profile Card */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Личные данные
              </CardTitle>
              {!editingProfile && (
                <Button size="sm" variant="outline" onClick={() => setEditingProfile(true)}>
                  Редактировать
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {editingProfile ? (
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="fullName">Полное имя</Label>
                  <Input id="fullName" name="fullName" required defaultValue={user.fullName} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">Электронная почта</Label>
                  <Input id="email" name="email" type="email" required defaultValue={user.email} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input id="phone" name="phone" placeholder="+7 999 000 00 00" />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" size="sm" disabled={profileMutation.isPending}>
                    <Save className="h-4 w-4 mr-1" />
                    {profileMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setEditingProfile(false)}>
                    Отмена
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Имя</div>
                    <div className="font-medium">{user.fullName}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Электронная почта (логин)</div>
                    <div className="font-medium">{user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Роль</div>
                    <div className="font-medium">{ROLE_LABELS[user.role] ?? user.role}</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Password Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Безопасность
              </CardTitle>
              {!editingPassword && (
                <Button size="sm" variant="outline" onClick={() => setEditingPassword(true)}>
                  Сменить пароль
                </Button>
              )}
            </div>
          </CardHeader>
          {editingPassword && (
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="newPassword">Новый пароль</Label>
                  <Input id="newPassword" name="newPassword" type="password" required minLength={6} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="confirmPassword">Повторите пароль</Label>
                  <Input id="confirmPassword" name="confirmPassword" type="password" required />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" size="sm" disabled={passwordMutation.isPending}>
                    {passwordMutation.isPending ? 'Сохранение...' : 'Сменить'}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setEditingPassword(false)}>
                    Отмена
                  </Button>
                </div>
              </form>
            </CardContent>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}
