'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getGroup, getAthletes } from '@/lib/api';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Users, Calendar, User } from 'lucide-react';

const WEEKDAY_LABELS: Record<string, string> = {
  mon: 'Пн',
  tue: 'Вт',
  wed: 'Ср',
  thu: 'Чт',
  fri: 'Пт',
  sat: 'Сб',
  sun: 'Вс',
};

interface GroupDetail {
  id: string;
  name: string;
  sportType?: string;
  monthlyFee?: number;
  capacity?: number;
  level?: string;
  ageFrom?: number;
  ageTo?: number;
  coach?: { id: string; user?: { fullName?: string; email?: string } };
  schedules?: Array<{ weekday: string; startTime: string; endTime: string; location?: string }>;
}

interface Athlete {
  id: string;
  fullName: string;
  birthDate?: string;
  paymentStatus?: string;
  medicalStatus?: string;
}

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function GroupDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: group, isLoading } = useQuery<GroupDetail>({
    queryKey: ['group', id],
    queryFn: () => getGroup(id),
  });

  const { data: athletes = [], isLoading: athletesLoading } = useQuery<Athlete[]>({
    queryKey: ['athletes', 'group', id],
    queryFn: () => getAthletes({ groupId: id }),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      </MainLayout>
    );
  }

  if (!group) {
    return (
      <MainLayout>
        <div className="p-6 text-center text-gray-500">Группа не найдена</div>
      </MainLayout>
    );
  }

  const coachName = group.coach?.user?.fullName || '—';
  const coachEmail = group.coach?.user?.email || '';

  const scheduleText = group.schedules && group.schedules.length > 0
    ? group.schedules.map((s) => `${WEEKDAY_LABELS[s.weekday] || s.weekday} ${s.startTime}–${s.endTime}${s.location ? ` (${s.location})` : ''}`).join(', ')
    : '—';

  return (
    <MainLayout allowedRoles={['admin', 'coach']}>
      <div className="p-6 max-w-6xl mx-auto">
        <a href="/groups" className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Назад к группам
        </a>

        {/* Header */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{group.name}</h1>
              <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                {group.sportType && <Badge variant="outline">{group.sportType}</Badge>}
                {group.level && <Badge variant="outline">{group.level}</Badge>}
                {group.monthlyFee != null && (
                  <span>{group.monthlyFee.toLocaleString('ru-RU')} ₽/мес</span>
                )}
                {group.ageFrom != null && group.ageTo != null && (
                  <span>{group.ageFrom}–{group.ageTo} лет</span>
                )}
              </div>
            </div>
            <div className="bg-blue-50 text-blue-600 rounded-full px-4 py-2 text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              {athletesLoading ? '...' : athletes.length} спортсменов
              {group.capacity != null && ` / ${group.capacity}`}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-gray-500">
                <User className="h-4 w-4" />
                Тренер
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-medium">{coachName}</div>
              {coachEmail && (
                <div className="text-sm text-gray-400">{coachEmail}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-gray-500">
                <Calendar className="h-4 w-4" />
                Расписание
              </CardTitle>
            </CardHeader>
            <CardContent>
              {group.schedules && group.schedules.length > 0 ? (
                <div className="space-y-1">
                  {group.schedules.map((s, i) => (
                    <div key={i} className="text-sm">
                      <span className="font-medium">{WEEKDAY_LABELS[s.weekday] || s.weekday}</span>
                      {' '}{s.startTime}–{s.endTime}
                      {s.location && <span className="text-gray-400"> · {s.location}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-400">Расписание не указано</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-gray-500">
                <Users className="h-4 w-4" />
                Состав
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{athletesLoading ? '…' : athletes.length}</div>
              <div className="text-sm text-gray-400">
                спортсменов{group.capacity != null ? ` из ${group.capacity}` : ''}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Athletes in group */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Спортсмены группы</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ФИО</TableHead>
                  <TableHead>Возраст</TableHead>
                  <TableHead>Оплата</TableHead>
                  <TableHead>Медсправка</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {athletesLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : athletes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                      В группе нет спортсменов
                    </TableCell>
                  </TableRow>
                ) : (
                  athletes.map((athlete) => (
                    <TableRow
                      key={athlete.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => { window.location.href = `/athletes/${athlete.id}`; }}
                    >
                      <TableCell className="font-medium">{athlete.fullName}</TableCell>
                      <TableCell>
                        {athlete.birthDate ? calculateAge(athlete.birthDate) + ' лет' : '—'}
                      </TableCell>
                      <TableCell>
                        {athlete.paymentStatus ? <StatusBadge status={athlete.paymentStatus} /> : '—'}
                      </TableCell>
                      <TableCell>
                        {athlete.medicalStatus ? <StatusBadge status={athlete.medicalStatus} /> : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
