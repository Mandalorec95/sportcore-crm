'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAthleteSportPassport,
  getAthleteProgress,
  addAthleteProgress,
  getPayments,
  getAthleteMedicalDocuments,
  getAthleteCompetitions,
  updateAthlete,
  deleteAthlete,
} from '@/lib/api';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  User,
  Calendar,
  Phone,
  Award,
  TrendingUp,
  FileText,
  CreditCard,
  CalendarCheck,
  Plus,
  ArrowLeft,
  Edit,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

interface Passport {
  athlete: {
    id: string;
    fullName: string;
    birthDate?: string;
    sportType?: string;
    level?: string;
    group?: string;
    coach?: string;
    status?: string;
  };
  attendanceRate?: number;
  paymentStatus?: string;
  medicalStatus?: string;
  churnRiskScore?: number;
  competitionReadinessScore?: number;
  parents?: Array<{ fullName: string; phone: string; relation: string }>;
  recentProgress?: Array<{ skillName: string; score: number; comment?: string; measuredAt: string }>;
}

interface ProgressEntry {
  id: string;
  skillName?: string;
  score?: number;
  delta?: number;
  date?: string;
  notes?: string;
  comment?: string;
  measuredAt?: string;
}

interface Payment {
  id: string;
  periodMonth?: string;
  amount?: number;
  paidAmount?: number;
  status?: string;
  dueDate?: string;
}

interface MedDoc {
  id: string;
  docType?: string;
  validUntil?: string;
  issuedAt?: string;
  status?: string;
}

interface CompResult {
  id: string;
  competition?: { name?: string; compDate?: string };
  discipline?: string;
  category?: string;
  place?: number;
  medal?: string;
}

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function AthletePassportPage() {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const [showAddProgress, setShowAddProgress] = useState(false);
  const [showEditAthlete, setShowEditAthlete] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: passport, isLoading } = useQuery<Passport>({
    queryKey: ['athlete-passport', id],
    queryFn: () => getAthleteSportPassport(id),
  });

  const { data: progressData } = useQuery<{ records: ProgressEntry[] } | ProgressEntry[]>({
    queryKey: ['athlete-progress', id],
    queryFn: () => getAthleteProgress(id),
  });

  const { data: payments = [] } = useQuery<Payment[]>({
    queryKey: ['athlete-payments', id],
    queryFn: () => getPayments({ athleteId: id }),
  });

  const { data: medDocs = [] } = useQuery<MedDoc[]>({
    queryKey: ['athlete-medical', id],
    queryFn: () => getAthleteMedicalDocuments(id),
  });

  const { data: competitions = [] } = useQuery<CompResult[]>({
    queryKey: ['athlete-competitions', id],
    queryFn: () => getAthleteCompetitions(id),
  });

  // Normalize progress data — API returns { records: [...] }
  const progress: ProgressEntry[] = Array.isArray(progressData)
    ? progressData
    : (progressData as { records: ProgressEntry[] })?.records ?? [];

  const addProgressMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => addAthleteProgress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['athlete-progress', id] });
      setShowAddProgress(false);
      toast.success('Прогресс добавлен');
    },
    onError: () => toast.error('Ошибка при добавлении прогресса'),
  });

  const updateAthleteMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => updateAthlete(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['athlete-passport', id] });
      setShowEditAthlete(false);
      toast.success('Данные обновлены');
    },
    onError: () => toast.error('Ошибка при обновлении'),
  });

  const deleteAthleteMutation = useMutation({
    mutationFn: () => deleteAthlete(id),
    onSuccess: () => {
      toast.success('Спортсмен удалён');
      window.location.href = '/athletes';
    },
    onError: () => toast.error('Ошибка при удалении'),
  });

  const handleAddProgress = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    addProgressMutation.mutate({
      skillName: fd.get('skillName'),
      score: Number(fd.get('score')),
      comment: fd.get('notes'),
      measuredAt: new Date().toISOString(),
    });
  };

  const handleEditAthlete = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {};
    ['firstName', 'lastName', 'birthDate', 'sportType', 'level', 'status'].forEach((key) => {
      const val = fd.get(key);
      if (val) data[key] = val;
    });
    updateAthleteMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      </MainLayout>
    );
  }

  if (!passport) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="text-center text-gray-500">Спортсмен не найден</div>
        </div>
      </MainLayout>
    );
  }

  const { athlete, parents = [], attendanceRate, churnRiskScore, competitionReadinessScore } = passport;
  const totalDebt = payments.filter(p => p.status === 'debt').reduce((s, p) => s + ((p.amount ?? 0) - (p.paidAmount ?? 0)), 0);

  const churnLabel = churnRiskScore != null
    ? churnRiskScore >= 70 ? 'high' : churnRiskScore >= 40 ? 'medium' : 'low'
    : null;

  const readinessLabel = competitionReadinessScore != null
    ? `${competitionReadinessScore}%`
    : null;

  return (
    <MainLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Back button */}
        <a href="/athletes" className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Назад к списку
        </a>

        {/* Header */}
        <div className="bg-white rounded-xl border p-6 mb-6 flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold flex-shrink-0">
            {athlete.fullName.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{athlete.fullName}</h1>
              {athlete.status && <StatusBadge status={athlete.status} />}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              {athlete.birthDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {calculateAge(athlete.birthDate)} лет ({new Date(athlete.birthDate).toLocaleDateString('ru-RU')})
                </span>
              )}
              {athlete.sportType && <span>{athlete.sportType}</span>}
              {athlete.group && <span>{athlete.group}</span>}
              {parents[0]?.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {parents[0].phone}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {churnRiskScore != null && (
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">Риск оттока</div>
                <Badge variant="outline" className={churnRiskScore >= 70 ? 'text-red-600 border-red-300' : churnRiskScore >= 40 ? 'text-yellow-600 border-yellow-300' : 'text-green-600 border-green-300'}>
                  {churnRiskScore}%
                </Badge>
              </div>
            )}
            {competitionReadinessScore != null && (
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">К соревнованиям</div>
                <Badge variant="outline" className="text-blue-600 border-blue-300">{readinessLabel}</Badge>
              </div>
            )}
            <Button size="sm" variant="outline" onClick={() => setShowEditAthlete(true)}>
              <Edit className="h-4 w-4 mr-1" />
              Редактировать
            </Button>
            <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="h-4 w-4 mr-1" />
              Удалить
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-1.5" />
              Профиль
            </TabsTrigger>
            <TabsTrigger value="attendance">
              <CalendarCheck className="h-4 w-4 mr-1.5" />
              Посещаемость
            </TabsTrigger>
            <TabsTrigger value="payments">
              <CreditCard className="h-4 w-4 mr-1.5" />
              Оплаты
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4 mr-1.5" />
              Документы
            </TabsTrigger>
            <TabsTrigger value="progress">
              <TrendingUp className="h-4 w-4 mr-1.5" />
              Прогресс
            </TabsTrigger>
            <TabsTrigger value="competitions">
              <Award className="h-4 w-4 mr-1.5" />
              Соревнования
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Личные данные</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow label="ФИО" value={athlete.fullName} />
                  <InfoRow label="Дата рождения" value={athlete.birthDate ? new Date(athlete.birthDate).toLocaleDateString('ru-RU') : '—'} />
                  <InfoRow label="Вид спорта" value={athlete.sportType || '—'} />
                  <InfoRow label="Уровень" value={athlete.level || '—'} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Организация</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow label="Группа" value={typeof athlete.group === 'string' ? athlete.group : '—'} />
                  <InfoRow label="Тренер" value={typeof athlete.coach === 'string' ? athlete.coach : '—'} />
                </CardContent>
              </Card>
              {parents.length > 0 && (
                <Card className="md:col-span-2">
                  <CardHeader><CardTitle className="text-base">Родители / Контакты</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ФИО</TableHead>
                          <TableHead>Телефон</TableHead>
                          <TableHead>Степень родства</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parents.map((p, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{p.fullName}</TableCell>
                            <TableCell className="flex items-center gap-1"><Phone className="h-3 w-3" /> {p.phone}</TableCell>
                            <TableCell>{p.relation}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {attendanceRate != null ? `${Math.round(attendanceRate)}%` : '—'}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Посещаемость</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-gray-600">{passport.paymentStatus ? <StatusBadge status={passport.paymentStatus} /> : '—'}</div>
                  <div className="text-sm text-gray-500 mt-1">Статус оплаты</div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Последние записи прогресса</CardTitle></CardHeader>
              <CardContent>
                {(passport.recentProgress ?? []).length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">Нет данных</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Навык</TableHead>
                        <TableHead>Оценка</TableHead>
                        <TableHead>Комментарий</TableHead>
                        <TableHead>Дата</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(passport.recentProgress ?? []).map((p, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{p.skillName}</TableCell>
                          <TableCell><Badge variant="outline">{p.score}</Badge></TableCell>
                          <TableCell className="text-gray-500 text-sm">{p.comment || '—'}</TableCell>
                          <TableCell>{p.measuredAt ? new Date(p.measuredAt).toLocaleDateString('ru-RU') : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            {totalDebt > 0 && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                <span className="font-semibold">Общий долг: {totalDebt.toLocaleString('ru-RU')} ₽</span>
              </div>
            )}
            <Card>
              <CardContent className="p-0">
                {payments.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">Нет данных об оплатах</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Период</TableHead>
                        <TableHead>Сумма</TableHead>
                        <TableHead>Оплачено</TableHead>
                        <TableHead>Срок</TableHead>
                        <TableHead>Статус</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{p.periodMonth || '—'}</TableCell>
                          <TableCell>{p.amount?.toLocaleString('ru-RU')} ₽</TableCell>
                          <TableCell>{(p.paidAmount ?? 0).toLocaleString('ru-RU')} ₽</TableCell>
                          <TableCell>{p.dueDate ? new Date(p.dueDate).toLocaleDateString('ru-RU') : '—'}</TableCell>
                          <TableCell>{p.status ? <StatusBadge status={p.status} /> : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardContent className="p-0">
                {medDocs.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">Нет документов</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Тип документа</TableHead>
                        <TableHead>Выдан</TableHead>
                        <TableHead>Действует до</TableHead>
                        <TableHead>Дней осталось</TableHead>
                        <TableHead>Статус</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medDocs.map((d) => {
                        const daysLeft = d.validUntil
                          ? Math.ceil((new Date(d.validUntil).getTime() - Date.now()) / 86400000)
                          : null;
                        return (
                          <TableRow key={d.id}>
                            <TableCell className="font-medium">{d.docType || '—'}</TableCell>
                            <TableCell>{d.issuedAt ? new Date(d.issuedAt).toLocaleDateString('ru-RU') : '—'}</TableCell>
                            <TableCell>{d.validUntil ? new Date(d.validUntil).toLocaleDateString('ru-RU') : '—'}</TableCell>
                            <TableCell>
                              {daysLeft != null ? (
                                <span className={daysLeft < 0 ? 'text-red-600' : daysLeft < 14 ? 'text-yellow-600' : 'text-green-600'}>
                                  {daysLeft < 0 ? 'истекло' : `${daysLeft} дн.`}
                                </span>
                              ) : '—'}
                            </TableCell>
                            <TableCell>{d.status ? <StatusBadge status={d.status} /> : '—'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Прогресс спортсмена</h3>
              <Button size="sm" onClick={() => setShowAddProgress(true)} className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                Добавить
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                {progress.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">Нет данных о прогрессе</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Навык</TableHead>
                        <TableHead>Оценка</TableHead>
                        <TableHead>Дата</TableHead>
                        <TableHead>Комментарий</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {progress.map((p, i) => (
                        <TableRow key={p.id || i}>
                          <TableCell className="font-medium">{p.skillName || '—'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{p.score ?? '—'}</Badge>
                          </TableCell>
                          <TableCell>{(p.measuredAt || p.date) ? new Date(p.measuredAt || p.date!).toLocaleDateString('ru-RU') : '—'}</TableCell>
                          <TableCell className="text-gray-500 text-sm">{p.comment || p.notes || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Dialog open={showAddProgress} onOpenChange={setShowAddProgress}>
              <DialogContent>
                <DialogHeader><DialogTitle>Добавить прогресс</DialogTitle></DialogHeader>
                <form onSubmit={handleAddProgress} className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="skillName">Навык *</Label>
                    <Input id="skillName" name="skillName" required placeholder="Скорость, техника..." />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="score">Оценка (1-10) *</Label>
                    <Input id="score" name="score" type="number" required placeholder="8" step="1" min="1" max="10" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="notes">Комментарий</Label>
                    <Textarea id="notes" name="notes" placeholder="Комментарий тренера..." rows={3} />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setShowAddProgress(false)}>Отмена</Button>
                    <Button type="submit" disabled={addProgressMutation.isPending}>
                      {addProgressMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Competitions Tab */}
          <TabsContent value="competitions">
            <Card>
              <CardContent className="p-0">
                {competitions.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">Нет данных о соревнованиях</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Соревнование</TableHead>
                        <TableHead>Дата</TableHead>
                        <TableHead>Дисциплина</TableHead>
                        <TableHead>Категория</TableHead>
                        <TableHead>Место</TableHead>
                        <TableHead>Медаль</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {competitions.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.competition?.name || '—'}</TableCell>
                          <TableCell>{c.competition?.compDate ? new Date(c.competition.compDate).toLocaleDateString('ru-RU') : '—'}</TableCell>
                          <TableCell>{c.discipline || '—'}</TableCell>
                          <TableCell>{c.category || '—'}</TableCell>
                          <TableCell>
                            {c.place ? (
                              <Badge variant="outline" className="font-bold">
                                {c.place} место
                              </Badge>
                            ) : '—'}
                          </TableCell>
                          <TableCell>
                            {c.medal && c.medal !== 'none' ? <StatusBadge status={c.medal} /> : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Athlete Dialog */}
      <Dialog open={showEditAthlete} onOpenChange={setShowEditAthlete}>
        <DialogContent>
          <DialogHeader><DialogTitle>Редактировать спортсмена</DialogTitle></DialogHeader>
          <form onSubmit={handleEditAthlete} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Имя</Label>
                <Input name="firstName" placeholder="Имя" defaultValue={athlete.fullName.split(' ')[0] || ''} />
              </div>
              <div className="space-y-1">
                <Label>Фамилия</Label>
                <Input name="lastName" placeholder="Фамилия" defaultValue={athlete.fullName.split(' ')[1] || ''} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Дата рождения</Label>
              <Input name="birthDate" type="date" defaultValue={athlete.birthDate ? athlete.birthDate.split('T')[0] : ''} />
            </div>
            <div className="space-y-1">
              <Label>Вид спорта</Label>
              <Input name="sportType" placeholder="sambo, boxing..." defaultValue={athlete.sportType || ''} />
            </div>
            <div className="space-y-1">
              <Label>Уровень</Label>
              <select name="level" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" defaultValue={athlete.level || ''}>
                <option value="">Выберите...</option>
                <option value="beginner">Начинающий</option>
                <option value="intermediate">Средний</option>
                <option value="advanced">Продвинутый</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Статус</Label>
              <select name="status" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" defaultValue={athlete.status || ''}>
                <option value="active">Активный</option>
                <option value="inactive">Неактивный</option>
                <option value="suspended">Приостановлен</option>
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowEditAthlete(false)}>Отмена</Button>
              <Button type="submit" disabled={updateAthleteMutation.isPending}>
                {updateAthleteMutation.isPending ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Удалить спортсмена?</DialogTitle></DialogHeader>
          <p className="text-gray-500 text-sm">Это действие нельзя отменить. Все данные спортсмена будут удалены.</p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Отмена</Button>
            <Button variant="destructive" onClick={() => deleteAthleteMutation.mutate()} disabled={deleteAthleteMutation.isPending}>
              {deleteAthleteMutation.isPending ? 'Удаление...' : 'Удалить'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
