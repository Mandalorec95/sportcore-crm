'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { login } from '@/lib/api';
import { setAuth, getToken, getUser } from '@/lib/auth';
import { toast } from 'sonner';
import { Activity, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const schema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const token = getToken();
    const user = getUser();
    if (token && user) {
      if (user.role === 'parent') window.location.href = '/parent';
      else if (user.role === 'coach') window.location.href = '/athletes';
      else window.location.href = '/dashboard';
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const result = await login(data.email, data.password);
      setAuth(result.access_token, result.user);
      toast.success(`Добро пожаловать, ${result.user.fullName}!`);
      if (result.user.role === 'parent') {
        window.location.href = '/parent';
      } else if (result.user.role === 'coach') {
        window.location.href = '/athletes';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error?.response?.data?.message || 'Неверный логин или пароль';
      toast.error(message);
      console.error('Ошибка логина:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3 text-white">
            <div className="bg-blue-500 rounded-xl p-3">
              <Activity className="h-8 w-8" />
            </div>
            <div>
              <div className="text-2xl font-bold">SportPass CRM</div>
              <div className="text-blue-300 text-sm">Детские спортивные клубы</div>
            </div>
          </div>
        </div>

        <Card className="shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Вход в систему</CardTitle>
            <CardDescription>Введите ваши учётные данные для входа</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Электронная почта</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@sportcrm.ru"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Вход...
                  </span>
                ) : (
                  'Войти'
                )}
              </Button>
            </form>

            {/* Demo accounts */}
            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-gray-500 mb-3 text-center font-medium">Демо-аккаунты</p>
              <div className="space-y-2">
                {[
                  { role: 'Администратор', email: 'admin@sportcrm.ru', color: 'blue' },
                  { role: 'Тренер', email: 'coach@sportcrm.ru', color: 'green' },
                  { role: 'Родитель', email: 'parent@sportcrm.ru', color: 'purple' },
                ].map((acc) => (
                  <div key={acc.email} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                    <span className="font-medium text-gray-700">{acc.role}</span>
                    <span className="text-gray-500">{acc.email} / demo123</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
