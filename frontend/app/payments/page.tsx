'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPayments, getDebtors, confirmPayment, createPayment, updatePayment, deletePayment, getAthletes } from '@/lib/api';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { formatDate } from '@/lib/utils';
import { CreditCard, AlertCircle, Phone, Plus, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Payment {
  id: string;
  athlete?: { firstName?: string; lastName?: string; group?: { name?: string } };
  periodMonth?: string;
  amount?: number;
  paidAmount?: number;
  status?: string;
  dueDate?: string;
}

interface Debtor {
  paymentId: string;
  athleteId: string;
  fullName: string;
  group: string;
  debtAmount: number;
  periodMonth: string;
  parentPhone?: string;
  dueDate?: string;
  overdueDays?: number;
}

interface DebtorsResponse {
  totalDebt: number;
  count: number;
  debtors: Debtor[];
}

interface Athlete {
  id: string;
  fullName: string;
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  paid: 'оплачено',
  partial: 'частично',
  debt: 'долг задолженность',
  pending: 'ожидает ожидание',
};

const normalizeSearch = (value?: string | number | null) =>
  String(value ?? '').toLowerCase().trim();

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [confirmModal, setConfirmModal] = useState<{ paymentId: string; amount?: number } | null>(null);
  const [paidAmount, setPaidAmount] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ['payments'],
    queryFn: () => getPayments(),
  });

  const { data: debtorsData, isLoading: debtorsLoading } = useQuery<DebtorsResponse>({
    queryKey: ['debtors'],
    queryFn: getDebtors,
  });

  const { data: athletes = [] } = useQuery<Athlete[]>({
    queryKey: ['athletes'],
    queryFn: () => getAthletes(),
  });

  const debtors = debtorsData?.debtors ?? [];
  const totalDebt = debtorsData?.totalDebt ?? 0;
  const normalizedSearch = normalizeSearch(search);

  const confirmMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      confirmPayment(id, { paidAmount: amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['debtors'] });
      setConfirmModal(null);
      setPaidAmount('');
      toast.success('Оплата подтверждена');
    },
    onError: () => toast.error('Ошибка при подтверждении оплаты'),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => createPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['debtors'] });
      setShowCreateModal(false);
      toast.success('Платёж создан');
    },
    onError: () => toast.error('Ошибка при создании платежа'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['debtors'] });
      setDeleteId(null);
      toast.success('Платёж удалён');
    },
    onError: () => toast.error('Ошибка при удалении'),
  });

  const handleConfirm = () => {
    if (!confirmModal) return;
    const amount = parseFloat(paidAmount);
    if (!amount || amount <= 0) {
      toast.error('Введите корректную сумму');
      return;
    }
    confirmMutation.mutate({ id: confirmModal.paymentId, amount });
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      athleteId: fd.get('athleteId') as string,
      periodMonth: fd.get('periodMonth') as string,
      amount: Number(fd.get('amount')),
      dueDate: fd.get('dueDate') as string,
    });
  };

  const getFullName = (p: Payment) => {
    if (p.athlete?.firstName || p.athlete?.lastName) {
      return `${p.athlete.lastName ?? ''} ${p.athlete.firstName ?? ''}`.trim();
    }
    return '—';
  };

  const filteredPayments = payments.filter((p) => {
    if (!normalizedSearch) return true;
    const searchable = [
      getFullName(p),
      p.athlete?.group?.name,
      p.periodMonth,
      p.amount,
      p.paidAmount,
      p.dueDate,
      p.status,
      p.status ? PAYMENT_STATUS_LABELS[p.status] : '',
    ].join(' ');
    return normalizeSearch(searchable).includes(normalizedSearch);
  });

  const filteredDebtors = debtors.filter((d) => {
    if (!normalizedSearch) return true;
    const searchable = [
      d.fullName,
      d.group,
      d.parentPhone,
      d.debtAmount,
      d.periodMonth,
      d.dueDate,
      d.overdueDays,
      'долг должник задолженность',
    ].join(' ');
    return normalizeSearch(searchable).includes(normalizedSearch);
  });

  return (
    <MainLayout allowedRoles={['admin']}>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Оплаты</h1>
            <p className="text-gray-500 mt-1">Управление платежами спортсменов</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Создать оплату
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CreditCard className="h-8 w-8 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{payments.length}</div>
                  <div className="text-sm text-gray-500">Всего платежей</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-100 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <div>
                  <div className="text-2xl font-bold text-red-700">{debtors.length}</div>
                  <div className="text-sm text-red-500">Должников</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CreditCard className="h-8 w-8 text-green-500" />
                <div>
                  <div className="text-2xl font-bold text-green-700">
                    {payments.filter(p => p.status === 'paid').length}
                  </div>
                  <div className="text-sm text-gray-500">Оплачено</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <TabsList>
              <TabsTrigger value="all">Все платежи</TabsTrigger>
              <TabsTrigger value="debtors" className="text-red-600">
                Должники ({debtors.length})
                {totalDebt > 0 && <span className="ml-1 text-xs">· {totalDebt.toLocaleString('ru-RU')} ₽</span>}
              </TabsTrigger>
            </TabsList>
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по спортсмену, группе, периоду..."
                className="pl-9"
              />
            </div>
          </div>

          <TabsContent value="all">
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                {paymentsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                  </div>
                ) : (
                  <Table className="min-w-[600px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Спортсмен</TableHead>
                        <TableHead>Группа</TableHead>
                        <TableHead>Период</TableHead>
                        <TableHead>Сумма</TableHead>
                        <TableHead>Оплачено</TableHead>
                        <TableHead>Срок</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                            {normalizedSearch ? 'Ничего не найдено' : 'Нет данных'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPayments.map((p) => (
                          <TableRow key={p.id} className={p.status === 'debt' ? 'bg-red-50' : ''}>
                            <TableCell className="font-medium">
                              {getFullName(p)}
                            </TableCell>
                            <TableCell>{p.athlete?.group?.name || '—'}</TableCell>
                            <TableCell>{p.periodMonth || '—'}</TableCell>
                            <TableCell>{p.amount?.toLocaleString('ru-RU')} ₽</TableCell>
                            <TableCell>{(p.paidAmount ?? 0).toLocaleString('ru-RU')} ₽</TableCell>
                            <TableCell>{formatDate(p.dueDate)}</TableCell>
                            <TableCell>
                              {p.status ? <StatusBadge status={p.status} /> : '—'}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {p.status !== 'paid' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setConfirmModal({ paymentId: p.id, amount: p.amount });
                                      setPaidAmount(String(p.amount || ''));
                                    }}
                                  >
                                    Принять
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-500 hover:text-red-700"
                                  onClick={() => setDeleteId(p.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="debtors">
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                {debtorsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                  </div>
                ) : (
                  <Table className="min-w-[600px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Спортсмен</TableHead>
                        <TableHead>Группа</TableHead>
                        <TableHead>Телефон родителя</TableHead>
                        <TableHead>Долг</TableHead>
                        <TableHead>Просрочено дней</TableHead>
                        <TableHead>Период</TableHead>
                        <TableHead>Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDebtors.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className={`text-center py-8 ${normalizedSearch ? 'text-gray-500' : 'text-green-600'}`}>
                            {normalizedSearch ? 'Ничего не найдено' : 'Должников нет!'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDebtors.map((d) => (
                          <TableRow key={d.paymentId} className="bg-red-50">
                            <TableCell className="font-medium">{d.fullName}</TableCell>
                            <TableCell>{typeof d.group === 'string' ? d.group : '—'}</TableCell>
                            <TableCell>
                              <span className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3" />
                                {d.parentPhone || '—'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-red-700">
                                {d.debtAmount?.toLocaleString('ru-RU')} ₽
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-red-600 font-medium">{d.overdueDays ?? 0} дн.</span>
                            </TableCell>
                            <TableCell>{d.periodMonth || '—'}</TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setConfirmModal({ paymentId: d.paymentId, amount: d.debtAmount });
                                  setPaidAmount(String(d.debtAmount || ''));
                                }}
                              >
                                Принять оплату
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Confirm Modal */}
        <Dialog open={!!confirmModal} onOpenChange={() => { setConfirmModal(null); setPaidAmount(''); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Подтвердить оплату</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Сумма оплаты (₽)</Label>
                <Input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setConfirmModal(null)}>Отмена</Button>
                <Button onClick={handleConfirm} disabled={confirmMutation.isPending}>
                  {confirmMutation.isPending ? 'Сохранение...' : 'Подтвердить'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Payment Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent>
            <DialogHeader><DialogTitle>Создать оплату</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <Label>Спортсмен *</Label>
                <select name="athleteId" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                  <option value="">Выберите спортсмена...</option>
                  {athletes.map((a) => (
                    <option key={a.id} value={a.id}>{a.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Период (ГГГГ-ММ) *</Label>
                <Input name="periodMonth" required placeholder="2026-06" pattern="\d{4}-\d{2}" />
              </div>
              <div className="space-y-1">
                <Label>Сумма (₽) *</Label>
                <Input name="amount" type="number" required placeholder="3500" min="1" />
              </div>
              <div className="space-y-1">
                <Label>Срок оплаты</Label>
                <Input name="dueDate" type="date" />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Отмена</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Создание...' : 'Создать'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm Modal */}
        <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Удалить платёж?</DialogTitle></DialogHeader>
            <p className="text-gray-500 text-sm">Это действие нельзя отменить.</p>
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
