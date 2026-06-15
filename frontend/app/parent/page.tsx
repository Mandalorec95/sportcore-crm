'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyChildren, getParentApprovals, respondToApproval } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Users,
  Calendar,
  CreditCard,
  FileText,
  Trophy,
  TrendingUp,
  LogOut,
  Bell,
} from 'lucide-react';
import { clearAuth } from '@/lib/auth';
import { toast } from 'sonner';

interface Child {
  id: string;
  fullName: string;
  sportType?: string;
  sport?: string;
  group?: { name?: string; coach?: string | null };
  coach?: { fullName?: string; user?: { fullName?: string } };
  nextSession?: { date?: string; time?: string };
  paymentStatus?: string;
  medicalStatus?: string;
  attendanceRate?: number;
  avgGrade?: number | null;
  recentAttendance?: Array<{ date?: string; status?: string; grade?: number | null }>;
  recentProgress?: Array<{ skillName?: string; score?: number; measuredAt?: string; date?: string }>;
  recentCompetitions?: Array<{
    competition?: { name?: string; compDate?: string; date?: string };
    place?: number;
    medal?: string;
  }>;
  payments?: Array<{ periodMonth?: string; amount?: number; status?: string }>;
  medicalDocuments?: Array<{ docType?: string; validUntil?: string; status?: string }>;
}

interface CompetitionApproval {
  id?: string;
  athleteId: string;
  status: string;
  parentComment?: string;
  athlete?: { id: string; firstName: string; lastName: string };
  competition?: { id: string; name: string; compDate?: string };
  coach?: { fullName?: string };
}

export default function ParentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && user && user.role !== 'parent') router.push('/dashboard');
  }, [user, loading, router]);

  const { data: children = [], isLoading } = useQuery<Child[]>({
    queryKey: ['my-children'],
    queryFn: getMyChildren,
    enabled: !!user,
  });

  const { data: approvals = [] } = useQuery<CompetitionApproval[]>({
    queryKey: ['parent-approvals'],
    queryFn: getParentApprovals,
    enabled: !!user,
  });

  const respondMutation = useMutation({
    mutationFn: ({ competitionId, athleteId, status }: { competitionId: string; athleteId: string; status: 'approved' | 'rejected' }) =>
      respondToApproval(competitionId, athleteId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-approvals'] });
      toast.success('Ответ отправлен');
    },
    onError: () => toast.error('Ошибка при отправке ответа'),
  });

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const pendingApprovals = approvals.filter((a) => a.status === 'pending');

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

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Личный кабинет</h1>
        <p className="text-gray-500 mb-4">Информация о ваших детях</p>

        {/* Pending approvals banner */}
        {pendingApprovals.length > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-orange-800 flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Запросы на участие в соревнованиях ({pendingApprovals.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingApprovals.map((a, i) => (
                <div key={i} className="bg-white rounded-lg border border-orange-100 p-3">
                  <div className="font-medium text-gray-900 text-sm">
                    {a.athlete ? `${a.athlete.firstName} ${a.athlete.lastName}` : '—'}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Соревнование: <span className="font-medium">{a.competition?.name ?? '—'}</span>
                    {a.competition?.compDate && (
                      <span> · {new Date(a.competition.compDate).toLocaleDateString('ru-RU')}</span>
                    )}
                  </div>
                  {a.coach?.fullName && (
                    <div className="text-xs text-gray-400">Тренер: {a.coach.fullName}</div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs"
                      onClick={() => respondMutation.mutate({ competitionId: a.competition!.id, athleteId: a.athleteId, status: 'approved' })}
                      disabled={respondMutation.isPending}
                    >
                      Подтверждаю
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 h-7 text-xs"
                      onClick={() => respondMutation.mutate({ competitionId: a.competition!.id, athleteId: a.athleteId, status: 'rejected' })}
                      disabled={respondMutation.isPending}
                    >
                      Отказываю
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {children.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Нет данных о детях</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6 md:space-y-8">
            {children.map((child) => {
              const coachName = child.group?.coach || child.coach?.fullName || child.coach?.user?.fullName;
              const sport = child.sportType || child.sport;
              return (
                <div key={child.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  {/* Child header */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 md:p-6 text-white">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/20 flex items-center justify-center text-xl md:text-2xl font-bold shrink-0">
                        {child.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg md:text-xl font-bold">{child.fullName}</h2>
                        <div className="flex flex-wrap gap-2 mt-1 text-blue-100 text-xs md:text-sm">
                          {sport && <span>🏅 {sport}</span>}
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

                  <div className="p-4 md:p-6 space-y-5">
                    {/* Status + attendance */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <CreditCard className="h-5 w-5 mx-auto mb-1.5 text-gray-400" />
                        <div className="text-xs text-gray-500 mb-1.5">Оплата</div>
                        {child.payments?.[0]?.status ? (
                          <StatusBadge status={child.payments[0].status} />
                        ) : child.paymentStatus ? (
                          <StatusBadge status={child.paymentStatus} />
                        ) : (
                          <Badge variant="outline">—</Badge>
                        )}
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <FileText className="h-5 w-5 mx-auto mb-1.5 text-gray-400" />
                        <div className="text-xs text-gray-500 mb-1.5">Медсправка</div>
                        {child.medicalDocuments?.[0]?.status ? (
                          <StatusBadge status={child.medicalDocuments[0].status} />
                        ) : child.medicalStatus ? (
                          <StatusBadge status={child.medicalStatus} />
                        ) : (
                          <Badge variant="outline">—</Badge>
                        )}
                      </div>
                      {child.avgGrade != null && (
                        <div className="text-center p-3 bg-gray-50 rounded-xl col-span-2 md:col-span-1">
                          <TrendingUp className="h-5 w-5 mx-auto mb-1.5 text-gray-400" />
                          <div className="text-xs text-gray-500 mb-1.5">Средняя оценка</div>
                          <span className="font-bold text-blue-600 text-lg">{child.avgGrade}</span>
                          <span className="text-gray-400 text-xs"> / 5</span>
                        </div>
                      )}
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

                    {/* Recent attendance with grades */}
                    {child.recentAttendance && child.recentAttendance.length > 0 && (
                      <div>
                        <Separator className="mb-3" />
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Последние занятия
                        </h4>
                        <div className="space-y-1">
                          {child.recentAttendance.slice(0, 6).map((a, i) => (
                            <div key={i} className="flex items-center justify-between text-sm py-1">
                              <span className="text-gray-500">
                                {a.date ? new Date(a.date).toLocaleDateString('ru-RU') : '—'}
                              </span>
                              <div className="flex items-center gap-2">
                                {a.grade != null && (
                                  <Badge variant="outline" className="text-xs bg-blue-50">
                                    Оценка: {a.grade}
                                  </Badge>
                                )}
                                {a.status && <StatusBadge status={a.status} />}
                              </div>
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
                                {(p.measuredAt || p.date) && (
                                  <span className="text-xs text-gray-400">
                                    {new Date(p.measuredAt || p.date || '').toLocaleDateString('ru-RU')}
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
                        <Separator className="mb-3" />
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <Trophy className="h-4 w-4" />
                          Соревнования
                        </h4>
                        <div className="space-y-2">
                          {child.recentCompetitions.slice(0, 3).map((c, i) => (
                            <div key={i} className="flex items-center justify-between text-sm py-1">
                              <div>
                                <div className="font-medium text-gray-700">{c.competition?.name}</div>
                                {(c.competition?.compDate || c.competition?.date) && (
                                  <div className="text-xs text-gray-400">
                                    {new Date(c.competition.compDate || c.competition.date || '').toLocaleDateString('ru-RU')}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {c.place && <Badge variant="outline">{c.place} место</Badge>}
                                {c.medal && c.medal !== 'none' && <StatusBadge status={c.medal} />}
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
