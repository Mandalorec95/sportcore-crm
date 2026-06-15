'use client';

import { useQuery } from '@tanstack/react-query';
import { getMyChildren } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Activity,
  Users,
  Calendar,
  CreditCard,
  FileText,
  Trophy,
  TrendingUp,
  LogOut,
} from 'lucide-react';
import { clearAuth } from '@/lib/auth';

interface Child {
  id: string;
  fullName: string;
  sport?: string;
  group?: { name?: string };
  coach?: { fullName?: string; user?: { fullName?: string } };
  nextSession?: { date?: string; time?: string };
  paymentStatus?: string;
  medicalStatus?: string;
  attendanceRate?: number;
  recentAttendance?: Array<{ date?: string; status?: string; session?: { date?: string } }>;
  recentProgress?: Array<{ skillName?: string; score?: number; date?: string }>;
  recentCompetitions?: Array<{
    competition?: { name?: string; date?: string };
    place?: number;
    medal?: string;
  }>;
}

export default function ParentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && user && user.role !== 'parent') router.push('/dashboard');
  }, [user, loading, router]);

  const { data: children = [], isLoading } = useQuery<Child[]>({
    queryKey: ['my-children'],
    queryFn: getMyChildren,
    enabled: !!user,
  });

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-500 rounded-lg p-1.5">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">SportPass CRM</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-gray-500">Добро пожаловать, </span>
              <span className="font-medium text-gray-900">{user?.fullName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Личный кабинет</h1>
        <p className="text-gray-500 mb-6">Информация о ваших детях</p>

        {children.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Нет данных о детях</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {children.map((child) => {
              const coachName = child.coach?.fullName || child.coach?.user?.fullName;
              return (
                <div key={child.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  {/* Child header */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                        {child.fullName.charAt(0)}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{child.fullName}</h2>
                        <div className="flex flex-wrap gap-3 mt-1 text-blue-100 text-sm">
                          {child.sport && <span>🏅 {child.sport}</span>}
                          {child.group?.name && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {child.group.name}
                            </span>
                          )}
                          {coachName && <span>👨‍🏫 {coachName}</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Status badges */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <CreditCard className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                        <div className="text-xs text-gray-500 mb-2">Статус оплаты</div>
                        {child.paymentStatus ? (
                          <StatusBadge status={child.paymentStatus} />
                        ) : (
                          <Badge variant="outline">—</Badge>
                        )}
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-xl">
                        <FileText className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                        <div className="text-xs text-gray-500 mb-2">Медсправка</div>
                        {child.medicalStatus ? (
                          <StatusBadge status={child.medicalStatus} />
                        ) : (
                          <Badge variant="outline">—</Badge>
                        )}
                      </div>
                    </div>

                    {/* Attendance rate */}
                    {child.attendanceRate != null && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Посещаемость</span>
                          <span className="text-sm font-bold text-blue-600">{Math.round(child.attendanceRate)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 rounded-full h-2 transition-all"
                            style={{ width: `${Math.min(child.attendanceRate, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Next session */}
                    {child.nextSession && (
                      <div>
                        <Separator className="mb-4" />
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <span className="text-gray-500">Следующая тренировка:</span>
                          <span className="font-medium">
                            {child.nextSession.date
                              ? new Date(child.nextSession.date).toLocaleDateString('ru-RU', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long',
                                })
                              : '—'}
                            {child.nextSession.time && ` в ${child.nextSession.time}`}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Recent attendance */}
                    {child.recentAttendance && child.recentAttendance.length > 0 && (
                      <div>
                        <Separator className="mb-4" />
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Последние занятия
                        </h4>
                        <div className="space-y-1">
                          {child.recentAttendance.slice(0, 5).map((a, i) => (
                            <div key={i} className="flex items-center justify-between text-sm py-1">
                              <span className="text-gray-500">
                                {(a.session?.date || a.date)
                                  ? new Date(a.session?.date || a.date || '').toLocaleDateString('ru-RU')
                                  : '—'}
                              </span>
                              {a.status && <StatusBadge status={a.status} />}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent progress */}
                    {child.recentProgress && child.recentProgress.length > 0 && (
                      <div>
                        <Separator className="mb-4" />
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Прогресс
                        </h4>
                        <div className="space-y-2">
                          {child.recentProgress.slice(0, 3).map((p, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">{p.skillName}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{p.score}</Badge>
                                {p.date && (
                                  <span className="text-xs text-gray-400">
                                    {new Date(p.date).toLocaleDateString('ru-RU')}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent competitions */}
                    {child.recentCompetitions && child.recentCompetitions.length > 0 && (
                      <div>
                        <Separator className="mb-4" />
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Trophy className="h-4 w-4" />
                          Соревнования
                        </h4>
                        <div className="space-y-2">
                          {child.recentCompetitions.slice(0, 3).map((c, i) => (
                            <div key={i} className="flex items-center justify-between text-sm py-1">
                              <div>
                                <div className="font-medium text-gray-700">{c.competition?.name}</div>
                                {c.competition?.date && (
                                  <div className="text-xs text-gray-400">
                                    {new Date(c.competition.date).toLocaleDateString('ru-RU')}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {c.place && <Badge variant="outline">{c.place} место</Badge>}
                                {c.medal && <StatusBadge status={c.medal} />}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
