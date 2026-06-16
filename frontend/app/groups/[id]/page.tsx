'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addGroupMember, deleteAthlete, getGroup, getAthletes, removeGroupMember } from '@/lib/api';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Users, Calendar, User, Trash2, UserMinus, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

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
  parentPhone?: string | null;
  group?: { id: string; name: string } | null;
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
  const queryClient = useQueryClient();
  const [removeTarget, setRemoveTarget] = useState<Athlete | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Athlete | null>(null);
  const [showAddAthletes, setShowAddAthletes] = useState(false);
  const [athleteSearch, setAthleteSearch] = useState('');
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<string[]>([]);

  const { data: group, isLoading } = useQuery<GroupDetail>({
    queryKey: ['group', id],
    queryFn: () => getGroup(id),
  });

  const { data: athletes = [], isLoading: athletesLoading } = useQuery<Athlete[]>({
    queryKey: ['athletes', 'group', id],
    queryFn: () => getAthletes({ groupId: id }),
    enabled: !!id,
  });

  const { data: allAthletes = [], isLoading: allAthletesLoading } = useQuery<Athlete[]>({
    queryKey: ['athletes', 'available-for-group', id],
    queryFn: () => getAthletes(),
    enabled: showAddAthletes,
  });

  const refreshGroupAthletes = () => {
    queryClient.invalidateQueries({ queryKey: ['athletes', 'group', id] });
    queryClient.invalidateQueries({ queryKey: ['athletes'] });
    queryClient.invalidateQueries({ queryKey: ['group', id] });
    queryClient.invalidateQueries({ queryKey: ['groups'] });
  };

  const removeMemberMutation = useMutation({
    mutationFn: (athleteId: string) => removeGroupMember(id, athleteId),
    onSuccess: () => {
      refreshGroupAthletes();
      setRemoveTarget(null);
      toast.success('Спортсмен удалён из группы');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Не удалось удалить спортсмена из группы');
    },
  });

  const addMembersMutation = useMutation({
    mutationFn: (athleteIds: string[]) => addGroupMember(id, athleteIds),
    onSuccess: () => {
      refreshGroupAthletes();
      setSelectedAthleteIds([]);
      setAthleteSearch('');
      setShowAddAthletes(false);
      toast.success(selectedAthleteIds.length > 1 ? 'Спортсмены добавлены в группу' : 'Спортсмен добавлен в группу');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Не удалось добавить спортсмена в группу');
    },
  });

  const deleteAthleteMutation = useMutation({
    mutationFn: (athleteId: string) => deleteAthlete(athleteId),
    onSuccess: () => {
      refreshGroupAthletes();
      setDeleteTarget(null);
      toast.success('Спортсмен успешно удалён');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Не удалось удалить спортсмена');
    },
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

  const normalizedSearch = athleteSearch.trim().toLowerCase();
  const currentGroupAthleteIds = new Set(athletes.map((athlete) => athlete.id));
  const availableAthletes = allAthletes
    .filter((athlete) => athlete.group?.id !== id && !currentGroupAthleteIds.has(athlete.id))
    .filter((athlete) => {
      if (!normalizedSearch) return true;
      return [
        athlete.fullName,
        athlete.parentPhone,
        athlete.group?.name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));
    });

  const toggleAthleteSelection = (athleteId: string) => {
    setSelectedAthleteIds((current) =>
      current.includes(athleteId)
        ? current.filter((id) => id !== athleteId)
        : [...current, athleteId],
    );
  };

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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">Спортсмены группы</CardTitle>
              <Button type="button" size="sm" className="gap-1.5" onClick={() => setShowAddAthletes(true)}>
                <Plus className="h-4 w-4" />
                Добавить спортсмена
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader>
                <TableRow>
                  <TableHead>ФИО</TableHead>
                  <TableHead>Возраст</TableHead>
                  <TableHead>Оплата</TableHead>
                  <TableHead>Медсправка</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {athletesLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : athletes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
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
                      <TableCell className="text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="gap-1.5 whitespace-nowrap"
                            onClick={(event) => {
                              event.stopPropagation();
                              setRemoveTarget(athlete);
                            }}
                          >
                            <UserMinus className="h-4 w-4" />
                            Удалить из группы
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="gap-1.5 whitespace-nowrap text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            onClick={(event) => {
                              event.stopPropagation();
                              setDeleteTarget(athlete);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            Удалить спортсмена полностью
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog
          open={showAddAthletes}
          onOpenChange={(open) => {
            setShowAddAthletes(open);
            if (!open) {
              setSelectedAthleteIds([]);
              setAthleteSearch('');
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Добавить спортсмена в группу</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={athleteSearch}
                  onChange={(event) => setAthleteSearch(event.target.value)}
                  placeholder="Поиск по ФИО, телефону или группе"
                  className="pl-9"
                />
              </div>

              <div className="max-h-[420px] overflow-y-auto rounded-md border">
                {allAthletesLoading ? (
                  <div className="flex h-32 items-center justify-center">
                    <div className="h-7 w-7 animate-spin rounded-full border-b-2 border-blue-600" />
                  </div>
                ) : availableAthletes.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-500">
                    Подходящие спортсмены не найдены
                  </div>
                ) : (
                  <div className="divide-y">
                    {availableAthletes.map((athlete) => {
                      const checked = selectedAthleteIds.includes(athlete.id);
                      return (
                        <div
                          key={athlete.id}
                          role="button"
                          tabIndex={0}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                          onClick={() => toggleAthleteSelection(athlete.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              toggleAthleteSelection(athlete.id);
                            }
                          }}
                        >
                          <Checkbox
                            checked={checked}
                            onClick={(event) => event.stopPropagation()}
                            onCheckedChange={() => toggleAthleteSelection(athlete.id)}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-gray-900">{athlete.fullName}</div>
                            <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-gray-500">
                              <span>{athlete.group?.name ? `Сейчас: ${athlete.group.name}` : 'Без группы'}</span>
                              {athlete.parentPhone && <span>{athlete.parentPhone}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-500">
                  Выбрано: {selectedAthleteIds.length}
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowAddAthletes(false)}>
                    Отмена
                  </Button>
                  <Button
                    type="button"
                    onClick={() => addMembersMutation.mutate(selectedAthleteIds)}
                    disabled={selectedAthleteIds.length === 0 || addMembersMutation.isPending}
                  >
                    {addMembersMutation.isPending ? 'Добавление...' : 'Добавить выбранных'}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Удалить из группы?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-500">
              Спортсмен будет убран только из этой группы и останется в системе.
            </p>
            {removeTarget && (
              <p className="text-sm font-medium text-gray-900">{removeTarget.fullName}</p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setRemoveTarget(null)}>
                Отмена
              </Button>
              <Button
                type="button"
                onClick={() => removeTarget && removeMemberMutation.mutate(removeTarget.id)}
                disabled={removeMemberMutation.isPending}
              >
                {removeMemberMutation.isPending ? 'Удаление...' : 'Удалить из группы'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Удалить спортсмена полностью?</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-500">
              Вы уверены, что хотите полностью удалить спортсмена? Это действие удалит его данные из системы и отменить его будет нельзя.
            </p>
            {deleteTarget && (
              <p className="text-sm font-medium text-gray-900">{deleteTarget.fullName}</p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
                Отмена
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => deleteTarget && deleteAthleteMutation.mutate(deleteTarget.id)}
                disabled={deleteAthleteMutation.isPending}
              >
                {deleteAthleteMutation.isPending ? 'Удаление...' : 'Удалить'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
