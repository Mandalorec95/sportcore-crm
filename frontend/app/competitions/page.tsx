'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCompetitions, getCompetition, createCompetition, updateCompetition, deleteCompetition } from '@/lib/api';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trophy, Calendar, MapPin, ChevronRight, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Competition {
  id: string;
  name: string;
  compDate?: string;
  date?: string;
  location?: string;
  description?: string;
  sportType?: string;
  _count?: { results: number };
  results?: Array<{
    id: string;
    athlete?: { id?: string; firstName?: string; lastName?: string };
    discipline?: string;
    category?: string;
    place?: number;
    medal?: string;
  }>;
}

function getCompDate(comp: Competition) {
  return comp.compDate || comp.date || '';
}

function getResultName(r: { athlete?: { firstName?: string; lastName?: string } }) {
  if (r.athlete) return `${r.athlete.lastName ?? ''} ${r.athlete.firstName ?? ''}`.trim() || '—';
  return '—';
}

export default function CompetitionsPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editComp, setEditComp] = useState<Competition | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: competitions = [], isLoading } = useQuery<Competition[]>({
    queryKey: ['competitions'],
    queryFn: getCompetitions,
  });

  const { data: detail, isLoading: detailLoading } = useQuery<Competition>({
    queryKey: ['competition', selectedId],
    queryFn: () => getCompetition(selectedId!),
    enabled: !!selectedId,
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => createCompetition(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      setShowCreate(false);
      toast.success('Соревнование создано');
    },
    onError: () => toast.error('Ошибка при создании'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      updateCompetition(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      setEditComp(null);
      toast.success('Соревнование обновлено');
    },
    onError: () => toast.error('Ошибка при обновлении'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCompetition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      setDeleteId(null);
      toast.success('Соревнование удалено');
    },
    onError: () => toast.error('Ошибка при удалении'),
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      name: fd.get('name') as string,
      compDate: fd.get('compDate') as string,
      location: fd.get('location') as string,
      sportType: fd.get('sportType') as string,
      description: fd.get('description') as string,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editComp) return;
    const fd = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: editComp.id,
      data: {
        name: fd.get('name') as string,
        compDate: fd.get('compDate') as string,
        location: fd.get('location') as string,
        description: fd.get('description') as string,
      },
    });
  };

  const selected = competitions.find((c) => c.id === selectedId);

  return (
    <MainLayout allowedRoles={['admin', 'coach']}>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Соревнования</h1>
            <p className="text-gray-500 mt-1">История и результаты соревнований</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Создать соревнование
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : competitions.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Нет данных о соревнованиях</p>
          </div>
        ) : (
          <div className="space-y-3">
            {competitions.map((comp) => (
              <Card key={comp.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div
                      className="flex items-start gap-4 flex-1 cursor-pointer"
                      onClick={() => setSelectedId(comp.id)}
                    >
                      <div className="bg-blue-100 rounded-xl p-3">
                        <Trophy className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{comp.name}</div>
                        <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                          {getCompDate(comp) && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(getCompDate(comp)).toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </span>
                          )}
                          {comp.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {comp.location}
                            </span>
                          )}
                          {comp.sportType && <Badge variant="outline">{comp.sportType}</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {comp._count?.results != null && (
                        <Badge variant="outline">{comp._count.results} результатов</Badge>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); setEditComp(comp); }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500"
                        onClick={(e) => { e.stopPropagation(); setDeleteId(comp.id); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <ChevronRight
                        className="h-4 w-4 text-gray-400 cursor-pointer"
                        onClick={() => setSelectedId(comp.id)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Competition Detail Modal */}
        <Dialog open={!!selectedId} onOpenChange={() => setSelectedId(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg">
                {selected?.name || 'Соревнование'}
              </DialogTitle>
              {selected && (
                <div className="flex gap-3 text-sm text-gray-500 pt-1">
                  {getCompDate(selected) && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(getCompDate(selected)).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                  {selected.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {selected.location}
                    </span>
                  )}
                </div>
              )}
            </DialogHeader>

            {detail?.description && (
              <p className="text-sm text-gray-500 mt-1">{detail.description}</p>
            )}

            {detailLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : detail?.results && detail.results.length > 0 ? (
              <Card className="mt-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">Результаты ({detail.results.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Спортсмен</TableHead>
                        <TableHead>Дисциплина</TableHead>
                        <TableHead>Категория</TableHead>
                        <TableHead>Место</TableHead>
                        <TableHead>Медаль</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.results.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{getResultName(r)}</TableCell>
                          <TableCell>{r.discipline || '—'}</TableCell>
                          <TableCell>{r.category || '—'}</TableCell>
                          <TableCell>
                            {r.place ? (
                              <Badge
                                className={
                                  r.place === 1
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : r.place === 2
                                    ? 'bg-gray-100 text-gray-700'
                                    : r.place === 3
                                    ? 'bg-orange-100 text-orange-700'
                                    : ''
                                }
                                variant="outline"
                              >
                                {r.place} место
                              </Badge>
                            ) : '—'}
                          </TableCell>
                          <TableCell>
                            {r.medal && r.medal !== 'none' ? <StatusBadge status={r.medal} /> : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <Trophy className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>Нет результатов для этого соревнования</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Create Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader><DialogTitle>Создать соревнование</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <Label>Название *</Label>
                <Input name="name" required placeholder="Открытый чемпионат..." />
              </div>
              <div className="space-y-1">
                <Label>Дата *</Label>
                <Input name="compDate" type="date" required />
              </div>
              <div className="space-y-1">
                <Label>Место проведения</Label>
                <Input name="location" placeholder="Москва, СК Олимпийский" />
              </div>
              <div className="space-y-1">
                <Label>Вид спорта</Label>
                <Input name="sportType" placeholder="sambo, boxing..." />
              </div>
              <div className="space-y-1">
                <Label>Описание</Label>
                <Textarea name="description" placeholder="Дополнительная информация..." rows={3} />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Отмена</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Создание...' : 'Создать'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editComp} onOpenChange={() => setEditComp(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Редактировать соревнование</DialogTitle></DialogHeader>
            {editComp && (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-1">
                  <Label>Название *</Label>
                  <Input name="name" required defaultValue={editComp.name} />
                </div>
                <div className="space-y-1">
                  <Label>Дата *</Label>
                  <Input name="compDate" type="date" required defaultValue={getCompDate(editComp) ? getCompDate(editComp).split('T')[0] : ''} />
                </div>
                <div className="space-y-1">
                  <Label>Место проведения</Label>
                  <Input name="location" defaultValue={editComp.location || ''} />
                </div>
                <div className="space-y-1">
                  <Label>Описание</Label>
                  <Textarea name="description" rows={3} defaultValue={editComp.description || ''} />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setEditComp(null)}>Отмена</Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirm Dialog */}
        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Удалить соревнование?</DialogTitle></DialogHeader>
            <p className="text-gray-500 text-sm">Все результаты этого соревнования также будут удалены.</p>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setDeleteId(null)}>Отмена</Button>
              <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
