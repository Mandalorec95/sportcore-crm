'use client';

import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '@/lib/api';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserCheck,
  AlertCircle,
  FileWarning,
  Dumbbell,
  Trophy,
  TrendingUp,
} from 'lucide-react';

interface Competition {
  id: string;
  name: string;
  date: string;
  location?: string;
}

interface DashboardData {
  totalAthletes?: number;
  activeAthletes?: number;
  debtors?: number;
  expiringDocs?: number;
  todaySessions?: number;
  upcomingCompetitions?: Competition[];
}

function StatCard({
  title,
  value,
  icon: Icon,
  variant = 'default',
  subtitle,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'danger' | 'warning' | 'success';
  subtitle?: string;
}) {
  const variantStyles = {
    default: 'text-gray-900 bg-white',
    danger: 'text-red-700 bg-red-50 border-red-100',
    warning: 'text-yellow-700 bg-yellow-50 border-yellow-100',
    success: 'text-green-700 bg-green-50 border-green-100',
  };

  const iconStyles = {
    default: 'text-blue-500 bg-blue-100',
    danger: 'text-red-500 bg-red-100',
    warning: 'text-yellow-500 bg-yellow-100',
    success: 'text-green-500 bg-green-100',
  };

  return (
    <Card className={`border ${variantStyles[variant]}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-xl ${iconStyles[variant]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  });

  return (
    <MainLayout allowedRoles={['admin']}>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Обзор ключевых показателей вашего клуба</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
            Ошибка загрузки данных
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <StatCard
                title="Всего спортсменов"
                value={data?.totalAthletes ?? 0}
                icon={Users}
                subtitle="в базе данных"
              />
              <StatCard
                title="Активных спортсменов"
                value={data?.activeAthletes ?? 0}
                icon={UserCheck}
                variant="success"
                subtitle="занимаются сейчас"
              />
              <StatCard
                title="Должников"
                value={data?.debtors ?? 0}
                icon={AlertCircle}
                variant={(data?.debtors ?? 0) > 0 ? 'danger' : 'default'}
                subtitle="с задолженностью"
              />
              <StatCard
                title="Документов истекает"
                value={data?.expiringDocs ?? 0}
                icon={FileWarning}
                variant={(data?.expiringDocs ?? 0) > 0 ? 'warning' : 'default'}
                subtitle="в ближайшие 14 дней"
              />
              <StatCard
                title="Тренировок сегодня"
                value={data?.todaySessions ?? 0}
                icon={Dumbbell}
                subtitle="запланировано"
              />
              <StatCard
                title="Предстоящие соревнования"
                value={data?.upcomingCompetitions?.length ?? 0}
                icon={Trophy}
                variant="default"
                subtitle="ближайших"
              />
            </div>

            {/* Upcoming Competitions */}
            {data?.upcomingCompetitions && data.upcomingCompetitions.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center gap-2 pb-3">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-base">Предстоящие соревнования</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.upcomingCompetitions.map((comp) => (
                      <div
                        key={comp.id}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <div>
                          <div className="font-medium text-sm text-gray-900">{comp.name}</div>
                          {comp.location && (
                            <div className="text-xs text-gray-500">{comp.location}</div>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {new Date(comp.date).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
