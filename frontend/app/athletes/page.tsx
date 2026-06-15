'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getAthletes, getGroups, createAthlete, getCoaches } from '@/lib/api';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Search, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface Athlete {
  id: string;
  fullName: string;
  dateOfBirth: string;
  sport?: string;
  group?: { id: string; name: string };
  paymentStatus?: string;
  medicalStatus?: string;
  attendanceRate?: number;
  status?: string;
}

interface Group {
  id: string;
  name: string;
}

interface Coach {
  id: string;
  fullName: string;
  user?: { fullName: string };
}

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function AthletesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [formGroupId, setFormGroupId] = useState('');
  const [formCoachId, setFormCoachId] = useState('');

  const { data: athletes = [], isLoading } = useQuery<Athlete[]>({
    queryKey: ['athletes', selectedGroup, selectedStatus],
    queryFn: () =>
      getAthletes({
        groupId: selectedGroup !== 'all' ? selectedGroup : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
      }),
  });

  const { data: groups = [] } = useQuery<Group[]>({
    queryKey: ['groups'],
    queryFn: getGroups,
  });

  const { data: coaches = [] } = useQuery<Coach[]>({
    queryKey: ['coaches'],
    queryFn: getCoaches,
  });

  const createMutation = useMutation({
    mutationFn: createAthlete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['athletes'] });
      setShowCreate(false);
      toast.success('Спортсмен добавлен');
    },
    onError: () => toast.error('Ошибка при создании спортсмена'),
  });

  const filtered = athletes.filter((a) =>
    a.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      fullName: fd.get('fullName') as string,
      dateOfBirth: fd.get('dateOfBirth') as string,
      sport: fd.get('sport') as string,
      groupId: formGroupId || undefined,
      coachId: formCoachId || undefined,
      parentPhone: fd.get('parentPhone') as string,
      parentName: fd.get('parentName') as string,
    });
  };

  return (
    <MainLayout allowedRoles={['admin', 'coach']}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Спортсмены</h1>
            <p className="text-gray-500 mt-1">Управление спортсменами клуба</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Спортсмен
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-48">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Поиск по имени..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="min-w-40">
                <Select value={selectedGroup} onValueChange={(v) => setSelectedGroup(v ?? 'all')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Группа" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все группы</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-40">
                <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v ?? 'all')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Статус оплаты" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="paid">Оплачено</SelectItem>
                    <SelectItem value="debt">Долг</SelectItem>
                    <SelectItem value="partial">Частично</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ФИО</TableHead>
                    <TableHead>Возраст</TableHead>
                    <TableHead>Группа</TableHead>
                    <TableHead>Статус оплаты</TableHead>
                    <TableHead>Медсправка</TableHead>
                    <TableHead>Посещаемость</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                        Спортсмены не найдены
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((athlete) => (
                      <TableRow
                        key={athlete.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => router.push(`/athletes/${athlete.id}`)}
                      >
                        <TableCell className="font-medium">{athlete.fullName}</TableCell>
                        <TableCell>
                          {athlete.dateOfBirth ? calculateAge(athlete.dateOfBirth) + ' лет' : '—'}
                        </TableCell>
                        <TableCell>{athlete.group?.name || '—'}</TableCell>
                        <TableCell>
                          {athlete.paymentStatus ? (
                            <StatusBadge status={athlete.paymentStatus} />
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          {athlete.medicalStatus ? (
                            <StatusBadge status={athlete.medicalStatus} />
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          {athlete.attendanceRate != null
                            ? `${Math.round(athlete.attendanceRate)}%`
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Modal */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Новый спортсмен</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="fullName">ФИО *</Label>
                  <Input id="fullName" name="fullName" required placeholder="Иванов Иван Иванович" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="dateOfBirth">Дата рождения *</Label>
                  <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sport">Вид спорта</Label>
                  <Input id="sport" name="sport" placeholder="Футбол" />
                </div>
                <div className="space-y-1">
                  <Label>Группа</Label>
                  <Select value={formGroupId} onValueChange={(v) => setFormGroupId(v ?? '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите группу" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Тренер</Label>
                  <Select value={formCoachId} onValueChange={(v) => setFormCoachId(v ?? '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тренера" />
                    </SelectTrigger>
                    <SelectContent>
                      {coaches.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.fullName || c.user?.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="parentName">Имя родителя</Label>
                  <Input id="parentName" name="parentName" placeholder="Иванова Мария" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="parentPhone">Телефон родителя</Label>
                  <Input id="parentPhone" name="parentPhone" placeholder="+7 999 000 00 00" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Создание...' : 'Создать'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
