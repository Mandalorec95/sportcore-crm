'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getGroups, getCoaches, createGroup, updateGroup, deleteGroup } from '@/lib/api';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Users, ChevronRight, Dumbbell, DollarSign, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Group {
  id: string;
  name: string;
  sportType?: string;
  coach?: { id?: string; fullName?: string; user?: { fullName?: string } };
  coachId?: string;
  coachName?: string;
  athletesCount?: number;
  monthlyFee?: number;
  ageFrom?: number;
  ageTo?: number;
  capacity?: number;
}

interface Coach {
  id: string;
  fullName?: string;
  user?: { fullName?: string };
}

export default function GroupsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editGroup, setEditGroup] = useState<Group | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formCoachId, setFormCoachId] = useState('');
  const [editCoachId, setEditCoachId] = useState('');

  const { data: groups = [], isLoading } = useQuery<Group[]>({
    queryKey: ['groups'],
    queryFn: getGroups,
  });

  const { data: coaches = [] } = useQuery<Coach[]>({
    queryKey: ['coaches'],
    queryFn: getCoaches,
  });

  const createMutation = useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setShowCreate(false);
      setFormCoachId('');
      toast.success('Группа создана');
    },
    onError: () => toast.error('Ошибка при создании группы'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setEditGroup(null);
      toast.success('Группа обновлена');
    },
    onError: () => toast.error('Ошибка при обновлении'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setDeleteId(null);
      toast.success('Группа удалена');
    },
    onError: () => toast.error('Ошибка при удалении'),
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      name: fd.get('name') as string,
      sportType: (fd.get('sportType') as string) || undefined,
      coachId: formCoachId || undefined,
      monthlyFee: fd.get('monthlyFee') ? Number(fd.get('monthlyFee')) : undefined,
      capacity: fd.get('capacity') ? Number(fd.get('capacity')) : undefined,
      ageFrom: fd.get('ageFrom') ? Number(fd.get('ageFrom')) : undefined,
      ageTo: fd.get('ageTo') ? Number(fd.get('ageTo')) : undefined,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editGroup) return;
    const fd = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: editGroup.id,
      data: {
        name: fd.get('name') as string,
        sportType: (fd.get('sportType') as string) || undefined,
        coachId: editCoachId || undefined,
        monthlyFee: fd.get('monthlyFee') ? Number(fd.get('monthlyFee')) : undefined,
        capacity: fd.get('capacity') ? Number(fd.get('capacity')) : undefined,
        ageFrom: fd.get('ageFrom') ? Number(fd.get('ageFrom')) : undefined,
        ageTo: fd.get('ageTo') ? Number(fd.get('ageTo')) : undefined,
      },
    });
  };

  const coachName = (g: Group) =>
    g.coachName ?? g.coach?.fullName ?? g.coach?.user?.fullName ?? null;

  const openEdit = (g: Group) => {
    setEditGroup(g);
    setEditCoachId(g.coachId ?? g.coach?.id ?? '');
  };

  return (
    <MainLayout allowedRoles={['admin', 'coach']}>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Группы</h1>
            <p className="text-gray-500 mt-1">Спортивные группы клуба</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Создать группу
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <Card key={group.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 cursor-pointer" onClick={() => router.push(`/groups/${group.id}`)}>
                      <CardTitle className="text-base">{group.name}</CardTitle>
                      {group.sportType && (
                        <Badge variant="outline" className="w-fit text-xs mt-1">{group.sportType}</Badge>
                      )}
                    </div>
                    <div className="flex gap-1 ml-2 flex-shrink-0">
                      <button
                        onClick={() => openEdit(group)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                        title="Редактировать"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(group.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                        title="Удалить"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => router.push(`/groups/${group.id}`)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 cursor-pointer" onClick={() => router.push(`/groups/${group.id}`)}>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>{group.athletesCount ?? 0} спортсменов</span>
                    {group.capacity && <span className="text-gray-400">/ {group.capacity}</span>}
                  </div>
                  {coachName(group) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Dumbbell className="h-4 w-4 text-green-500" />
                      <span>{coachName(group)}</span>
                    </div>
                  )}
                  {group.monthlyFee != null && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 text-yellow-500" />
                      <span>{group.monthlyFee.toLocaleString('ru-RU')} ₽/мес</span>
                    </div>
                  )}
                  {(group.ageFrom || group.ageTo) && (
                    <div className="text-xs text-gray-400">
                      Возраст: {group.ageFrom ?? '?'}–{group.ageTo ?? '?'} лет
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {groups.length === 0 && (
              <div className="col-span-3 text-center text-gray-500 py-12">
                Групп нет. Создайте первую группу.
              </div>
            )}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Новая группа</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">Название *</Label>
                <Input id="name" name="name" required placeholder="Группа А" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="sportType">Вид спорта</Label>
                  <Input id="sportType" name="sportType" placeholder="Борьба" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="monthlyFee">Абонемент (₽)</Label>
                  <Input id="monthlyFee" name="monthlyFee" type="number" placeholder="3000" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ageFrom">Возраст от</Label>
                  <Input id="ageFrom" name="ageFrom" type="number" placeholder="6" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ageTo">Возраст до</Label>
                  <Input id="ageTo" name="ageTo" type="number" placeholder="12" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="capacity">Мест в группе</Label>
                  <Input id="capacity" name="capacity" type="number" placeholder="20" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Тренер</Label>
                <Select modal={false} value={formCoachId} onValueChange={(v) => setFormCoachId(v ?? '')}>
                  <SelectTrigger><SelectValue placeholder="Выберите тренера" /></SelectTrigger>
                  <SelectContent>
                    {coaches.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.fullName ?? c.user?.fullName ?? c.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
        <Dialog open={!!editGroup} onOpenChange={() => setEditGroup(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Редактировать группу</DialogTitle></DialogHeader>
            {editGroup && (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-1">
                  <Label>Название *</Label>
                  <Input name="name" required defaultValue={editGroup.name} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Вид спорта</Label>
                    <Input name="sportType" defaultValue={editGroup.sportType ?? ''} />
                  </div>
                  <div className="space-y-1">
                    <Label>Абонемент (₽)</Label>
                    <Input name="monthlyFee" type="number" defaultValue={editGroup.monthlyFee ?? ''} />
                  </div>
                  <div className="space-y-1">
                    <Label>Возраст от</Label>
                    <Input name="ageFrom" type="number" defaultValue={editGroup.ageFrom ?? ''} />
                  </div>
                  <div className="space-y-1">
                    <Label>Возраст до</Label>
                    <Input name="ageTo" type="number" defaultValue={editGroup.ageTo ?? ''} />
                  </div>
                  <div className="space-y-1">
                    <Label>Мест</Label>
                    <Input name="capacity" type="number" defaultValue={editGroup.capacity ?? ''} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Тренер</Label>
                  <Select modal={false} value={editCoachId} onValueChange={(v) => setEditCoachId(v ?? '')}>
                    <SelectTrigger><SelectValue placeholder="Выберите тренера" /></SelectTrigger>
                    <SelectContent>
                      {coaches.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.fullName ?? c.user?.fullName ?? c.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setEditGroup(null)}>Отмена</Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirm */}
        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Удалить группу?</DialogTitle></DialogHeader>
            <p className="text-gray-500 text-sm">Спортсмены будут откреплены от группы. Это действие нельзя отменить.</p>
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
