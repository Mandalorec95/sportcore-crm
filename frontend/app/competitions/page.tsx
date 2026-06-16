'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCompetitions, getCompetition, createCompetition, updateCompetition, deleteCompetition, addCompetitionResult, getAthletes, getAthletesReadiness, getCompetitionApprovals, setCompetitionParticipants } from '@/lib/api';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Trophy, Calendar, MapPin, ChevronRight, Plus, Edit, Trash2, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

interface Competition {
  id: string;
  name: string;
  compDate?: string;
  date?: string;
  location?: string;
  description?: string;
  sportType?: string;
  _count?: { results: number };
  participantCount?: number;
  results?: Array<{
    id: string;
    athlete?: { id?: string; firstName?: string; lastName?: string };
    discipline?: string;
    category?: string;
    place?: number;
    medal?: string;
  }>;
  approvals?: Approval[];
}

function getCompDate(comp: Competition) {
  return comp.compDate || comp.date || '';
}

function getResultName(r: { athlete?: { firstName?: string; lastName?: string } }) {
  if (r.athlete) return `${r.athlete.lastName ?? ''} ${r.athlete.firstName ?? ''}`.trim() || '—';
  return '—';
}

interface Athlete {
  id: string;
  fullName: string;
}

interface AthleteReadiness {
  id: string;
  fullName: string;
  rate: number;
  avgGrade: number | null;
  readiness: 'green' | 'yellow' | 'red';
}

interface Approval {
  athleteId: string;
  status: string;
  athlete?: { id: string; firstName: string; lastName: string };
  parentComment?: string;
}

const READINESS_COLORS: Record<string, string> = {
  green: 'bg-green-100 text-green-700 border-green-200',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  red: 'bg-red-100 text-red-700 border-red-200',
};

const READINESS_ROW_COLORS: Record<string, string> = {
  green: 'bg-green-50 border-green-200 hover:bg-green-100',
  yellow: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
  red: 'bg-red-50 border-red-200 hover:bg-red-100',
};

const READINESS_LABELS: Record<string, string> = {
  green: 'Готов',
  yellow: 'Условно',
  red: 'Не готов',
};

export default function CompetitionsPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editComp, setEditComp] = useState<Competition | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showAddResult, setShowAddResult] = useState(false);
  const [resultAthleteId, setResultAthleteId] = useState('');
  const [participantCompetitionId, setParticipantCompetitionId] = useState<string | null>(null);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>([]);

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
    onSuccess: (created: Competition) => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      setShowCreate(false);
      toast.success('Соревнование создано');
      setParticipantCompetitionId(created.id);
      setSelectedParticipantIds([]);
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

  const addResultMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      addCompetitionResult(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competition', selectedId] });
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      setShowAddResult(false);
      setResultAthleteId('');
      toast.success('Результат добавлен');
    },
    onError: () => toast.error('Ошибка при добавлении результата'),
  });

  const { data: athletes = [] } = useQuery<Athlete[]>({
    queryKey: ['athletes'],
    queryFn: () => getAthletes(),
  });

  const { data: readiness = [] } = useQuery<AthleteReadiness[]>({
    queryKey: ['athletes-readiness'],
    queryFn: getAthletesReadiness,
  });

  const { data: approvals = [] } = useQuery<Approval[]>({
    queryKey: ['competition-approvals', selectedId],
    queryFn: () => getCompetitionApprovals(selectedId!),
    enabled: !!selectedId,
  });

  const { data: participantApprovals = [] } = useQuery<Approval[]>({
    queryKey: ['competition-participants', participantCompetitionId],
    queryFn: () => getCompetitionApprovals(participantCompetitionId!),
    enabled: !!participantCompetitionId,
  });

  useEffect(() => {
    if (!participantCompetitionId) return;
    setSelectedParticipantIds(
      participantApprovals
        .filter((approval) => approval.status === 'approved')
        .map((approval) => approval.athleteId),
    );
  }, [participantApprovals, participantCompetitionId]);

  const participantsMutation = useMutation({
    mutationFn: ({ competitionId, athleteIds }: { competitionId: string; athleteIds: string[] }) =>
      setCompetitionParticipants(competitionId, athleteIds),
    onSuccess: () => {
      if (participantCompetitionId) {
        queryClient.invalidateQueries({ queryKey: ['competition-participants', participantCompetitionId] });
        queryClient.invalidateQueries({ queryKey: ['competition', participantCompetitionId] });
      }
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      setParticipantCompetitionId(null);
      toast.success('Участники сохранены');
    },
    onError: () => toast.error('Ошибка при сохранении участников'),
  });

  const toggleParticipant = (athleteId: string) => {
    setSelectedParticipantIds((current) =>
      current.includes(athleteId)
        ? current.filter((id) => id !== athleteId)
        : [...current, athleteId],
    );
  };

  const openParticipantSelector = (competitionId: string) => {
    setSelectedParticipantIds([]);
    setParticipantCompetitionId(competitionId);
  };

  const participantRows = readiness;
  const detailParticipants = (detail?.approvals ?? approvals).filter((approval) => approval.status === 'approved');

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
                              {formatDate(getCompDate(comp))}
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
                      {comp.participantCount != null && (
                        <Badge variant="outline">{comp.participantCount} участников</Badge>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); openParticipantSelector(comp.id); }}
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Участники
                      </Button>
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
                      {formatDate(getCompDate(selected))}
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
            ) : (
              <Tabs defaultValue="results" className="mt-3">
                <TabsList className="w-full">
                  <TabsTrigger value="results" className="flex-1">Результаты</TabsTrigger>
                  <TabsTrigger value="participants" className="flex-1">Участники</TabsTrigger>
                </TabsList>

                <TabsContent value="results">
                  <div className="flex items-center justify-between mt-2 mb-2">
                    <span className="text-sm text-gray-500">{detail?.results?.length ?? 0} записей</span>
                    <Button size="sm" variant="outline" onClick={() => setShowAddResult(true)}>
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Добавить результат
                    </Button>
                  </div>
                  {detail?.results && detail.results.length > 0 ? (
                    <Card>
                      <CardContent className="p-0 overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Спортсмен</TableHead>
                              <TableHead>Дисциплина</TableHead>
                              <TableHead>Место</TableHead>
                              <TableHead>Медаль</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {detail.results.map((r) => (
                              <TableRow key={r.id}>
                                <TableCell className="font-medium">{getResultName(r)}</TableCell>
                                <TableCell>{r.discipline ?? '—'}</TableCell>
                                <TableCell>
                                  {r.place ? (
                                    <Badge
                                      className={
                                        r.place === 1 ? 'bg-yellow-100 text-yellow-800' :
                                        r.place === 2 ? 'bg-gray-100 text-gray-700' :
                                        r.place === 3 ? 'bg-orange-100 text-orange-700' : ''
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
                      <p>Нет результатов</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="participants">
                  <div className="flex items-center justify-between mt-2 mb-2">
                    <span className="text-sm text-gray-500">{detailParticipants.length} участников</span>
                    {selectedId && (
                      <Button size="sm" variant="outline" onClick={() => openParticipantSelector(selectedId)}>
                        <Users className="h-3.5 w-3.5 mr-1" />
                        Выбрать участников
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2 mb-3">
                    Готовность: <span className="text-green-600">Зелёный</span> — посещ. ≥80% и оценка ≥4 · <span className="text-yellow-600">Жёлтый</span> — 50–79% или 3–3.9 · <span className="text-red-600">Красный</span> — &lt;50% или &lt;3
                  </p>
                  {detailParticipants.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {detailParticipants.map((participant) => {
                        const fullName = participant.athlete
                          ? `${participant.athlete.firstName} ${participant.athlete.lastName}`.trim()
                          : participant.athleteId;
                        const readinessInfo = readiness.find((item) => item.id === participant.athleteId);
                        return (
                          <div
                            key={participant.athleteId}
                            className={`flex items-center gap-3 rounded-lg border p-3 ${readinessInfo ? READINESS_ROW_COLORS[readinessInfo.readiness] : 'bg-white'}`}
                          >
                            {readinessInfo && (
                              <Badge className={`text-xs border ${READINESS_COLORS[readinessInfo.readiness]}`} variant="outline">
                                {READINESS_LABELS[readinessInfo.readiness]}
                              </Badge>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">{fullName}</div>
                              {readinessInfo && (
                                <div className="text-xs text-gray-500">
                                  Посещ.: {readinessInfo.rate}%
                                  {readinessInfo.avgGrade != null ? ` · Оценка: ${readinessInfo.avgGrade}` : ''}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 py-8">
                      <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p>Участники ещё не выбраны</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>

        {/* Participants Dialog */}
        <Dialog
          open={!!participantCompetitionId}
          onOpenChange={(open) => {
            if (!open) {
              setParticipantCompetitionId(null);
              setSelectedParticipantIds([]);
            }
          }}
        >
          <DialogContent className="max-w-2xl max-h-[82vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Выбрать участников соревнования</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-xs text-gray-400">
                Зелёный — хорошие показатели, жёлтый — средние или спорные, красный — слабые. Цвет рассчитан по посещаемости и оценкам.
              </p>
              <div className="space-y-2">
                {participantRows.map((athlete) => {
                  const checked = selectedParticipantIds.includes(athlete.id);
                  return (
                    <div
                      key={athlete.id}
                      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${READINESS_ROW_COLORS[athlete.readiness]}`}
                    >
                      <Checkbox checked={checked} onCheckedChange={() => toggleParticipant(athlete.id)} />
                      <Badge className={`text-xs border ${READINESS_COLORS[athlete.readiness]}`} variant="outline">
                        {READINESS_LABELS[athlete.readiness]}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{athlete.fullName}</div>
                        <div className="text-xs text-gray-500">
                          Посещ.: {athlete.rate}%
                          {athlete.avgGrade != null ? ` · Оценка: ${athlete.avgGrade}` : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {participantRows.length === 0 && (
                  <div className="text-center text-gray-400 py-8 text-sm">Нет учеников</div>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 border-t pt-4">
                <span className="text-sm text-gray-500">Выбрано: {selectedParticipantIds.length}</span>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setParticipantCompetitionId(null);
                      setSelectedParticipantIds([]);
                    }}
                  >
                    Отмена
                  </Button>
                  <Button
                    type="button"
                    disabled={!participantCompetitionId || participantsMutation.isPending}
                    onClick={() => {
                      if (!participantCompetitionId) return;
                      participantsMutation.mutate({
                        competitionId: participantCompetitionId,
                        athleteIds: selectedParticipantIds,
                      });
                    }}
                  >
                    {participantsMutation.isPending ? 'Сохранение...' : 'Сохранить участников'}
                  </Button>
                </div>
              </div>
            </div>
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

        {/* Add Result Dialog */}
        <Dialog open={showAddResult} onOpenChange={(open) => { if (!open) { setShowAddResult(false); setResultAthleteId(''); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Добавить результат</DialogTitle></DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!selectedId) return;
                const fd = new FormData(e.currentTarget);
                const placeRaw = fd.get('place') as string;
                addResultMutation.mutate({
                  id: selectedId,
                  data: {
                    athleteId: resultAthleteId,
                    place: placeRaw ? parseInt(placeRaw, 10) : undefined,
                    medal: (fd.get('medal') as string) || 'none',
                    discipline: (fd.get('discipline') as string) || undefined,
                    category: (fd.get('category') as string) || undefined,
                  },
                });
              }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <Label>Спортсмен *</Label>
                <select
                  required
                  value={resultAthleteId}
                  onChange={(e) => setResultAthleteId(e.target.value)}
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Выберите спортсмена...</option>
                  {athletes.map((a) => (
                    <option key={a.id} value={a.id}>{a.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Место</Label>
                  <Input name="place" type="number" min={1} max={999} placeholder="1" />
                </div>
                <div className="space-y-1">
                  <Label>Медаль</Label>
                  <select
                    name="medal"
                    defaultValue="none"
                    className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">Без медали</option>
                    <option value="gold">Золото</option>
                    <option value="silver">Серебро</option>
                    <option value="bronze">Бронза</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Дисциплина</Label>
                <Input name="discipline" placeholder="Греко-римская борьба..." />
              </div>
              <div className="space-y-1">
                <Label>Категория</Label>
                <Input name="category" placeholder="До 60 кг, Юниоры..." />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => { setShowAddResult(false); setResultAthleteId(''); }}>
                  Отмена
                </Button>
                <Button type="submit" disabled={addResultMutation.isPending || !resultAthleteId}>
                  {addResultMutation.isPending ? 'Сохранение...' : 'Добавить'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
