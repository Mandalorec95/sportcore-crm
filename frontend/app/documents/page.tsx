'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMedicalDocuments,
  getExpiringDocuments,
  createMedicalDocument,
  updateMedicalDocument,
  deleteMedicalDocument,
  getAthletes,
} from '@/lib/api';
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
import { FileWarning, Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

interface MedDocument {
  id: string;
  athlete?: { id?: string; firstName?: string; lastName?: string; fullName?: string; group?: { name?: string } };
  docType?: string;
  issuedAt?: string;
  validUntil?: string;
  daysLeft?: number;
  status?: string;
}

interface Athlete {
  id: string;
  fullName: string;
}

const DOC_TYPES = [
  { value: 'medical_certificate', label: 'Медицинская справка' },
  { value: 'insurance', label: 'Страховка' },
  { value: 'consent', label: 'Согласие родителей' },
  { value: 'passport_copy', label: 'Копия паспорта' },
];

function getAthleteFullName(doc: MedDocument): string {
  if (doc.athlete?.fullName) return doc.athlete.fullName;
  if (doc.athlete?.firstName || doc.athlete?.lastName) {
    return `${doc.athlete.lastName ?? ''} ${doc.athlete.firstName ?? ''}`.trim();
  }
  return '—';
}

export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editDoc, setEditDoc] = useState<MedDocument | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: allDocs = [], isLoading: allLoading } = useQuery<MedDocument[]>({
    queryKey: ['medical-documents'],
    queryFn: () => getMedicalDocuments(),
  });

  const { data: expiringDocs = [], isLoading: expiringLoading } = useQuery<MedDocument[]>({
    queryKey: ['expiring-docs'],
    queryFn: getExpiringDocuments,
  });

  const { data: athletes = [] } = useQuery<Athlete[]>({
    queryKey: ['athletes'],
    queryFn: () => getAthletes(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => createMedicalDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-documents'] });
      queryClient.invalidateQueries({ queryKey: ['expiring-docs'] });
      setShowCreate(false);
      toast.success('Документ добавлен');
    },
    onError: () => toast.error('Ошибка при создании документа'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      updateMedicalDocument(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-documents'] });
      queryClient.invalidateQueries({ queryKey: ['expiring-docs'] });
      setEditDoc(null);
      toast.success('Документ обновлён');
    },
    onError: () => toast.error('Ошибка при обновлении'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMedicalDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-documents'] });
      queryClient.invalidateQueries({ queryKey: ['expiring-docs'] });
      setDeleteId(null);
      toast.success('Документ удалён');
    },
    onError: () => toast.error('Ошибка при удалении'),
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      athleteId: fd.get('athleteId') as string,
      docType: fd.get('docType') as string,
      issuedAt: fd.get('issuedAt') as string,
      validUntil: fd.get('validUntil') as string,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editDoc) return;
    const fd = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: editDoc.id,
      data: {
        docType: fd.get('docType') as string,
        issuedAt: fd.get('issuedAt') as string,
        validUntil: fd.get('validUntil') as string,
      },
    });
  };

  const getDaysLeft = (validUntil: string) => {
    return Math.ceil((new Date(validUntil).getTime() - Date.now()) / 86400000);
  };

  const getRowClass = (status: string | undefined, daysLeft: number | null) => {
    if (status === 'expired' || (daysLeft != null && daysLeft < 0)) return 'bg-red-50';
    if (status === 'expires_soon' || (daysLeft != null && daysLeft < 14)) return 'bg-yellow-50';
    return '';
  };

  const DocTable = ({ docs, isLoading }: { docs: MedDocument[]; isLoading: boolean }) => (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center text-green-600 py-12">
            <FileWarning className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Нет документов</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Спортсмен</TableHead>
                <TableHead>Группа</TableHead>
                <TableHead>Тип документа</TableHead>
                <TableHead>Выдан</TableHead>
                <TableHead>Действует до</TableHead>
                <TableHead>Дней осталось</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((doc) => {
                const daysLeft = doc.validUntil ? getDaysLeft(doc.validUntil) : (doc.daysLeft ?? null);
                const rowClass = getRowClass(doc.status, daysLeft);
                return (
                  <TableRow key={doc.id} className={rowClass}>
                    <TableCell className="font-medium">{getAthleteFullName(doc)}</TableCell>
                    <TableCell>{doc.athlete?.group?.name || '—'}</TableCell>
                    <TableCell>{doc.docType || '—'}</TableCell>
                    <TableCell>{doc.issuedAt ? new Date(doc.issuedAt).toLocaleDateString('ru-RU') : '—'}</TableCell>
                    <TableCell>
                      {doc.validUntil ? new Date(doc.validUntil).toLocaleDateString('ru-RU') : '—'}
                    </TableCell>
                    <TableCell>
                      {daysLeft != null ? (
                        <span className={daysLeft < 0 ? 'text-red-700 font-bold' : daysLeft < 14 ? 'text-yellow-700 font-semibold' : 'text-green-700'}>
                          {daysLeft < 0 ? `истекло ${Math.abs(daysLeft)} дн. назад` : `${daysLeft} дн.`}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      {doc.status ? <StatusBadge status={doc.status} /> : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setEditDoc(doc)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setDeleteId(doc.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  return (
    <MainLayout allowedRoles={['admin', 'coach']}>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Медицинские документы</h1>
            <p className="text-gray-500 mt-1">Контроль сроков действия медицинских справок</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Добавить документ
          </Button>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            Действует
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            Истекает ({'<'}14 дней)
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            Истекло
          </div>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">Все документы ({allDocs.length})</TabsTrigger>
            <TabsTrigger value="expiring" className="text-yellow-600">
              Требуют внимания ({expiringDocs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <DocTable docs={allDocs} isLoading={allLoading} />
          </TabsContent>

          <TabsContent value="expiring">
            <DocTable docs={expiringDocs} isLoading={expiringLoading} />
          </TabsContent>
        </Tabs>

        {/* Create Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader><DialogTitle>Добавить документ</DialogTitle></DialogHeader>
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
                <Label>Тип документа *</Label>
                <select name="docType" required className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                  <option value="">Выберите тип...</option>
                  {DOC_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Дата выдачи</Label>
                <Input name="issuedAt" type="date" />
              </div>
              <div className="space-y-1">
                <Label>Действует до *</Label>
                <Input name="validUntil" type="date" required />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Отмена</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Сохранение...' : 'Добавить'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editDoc} onOpenChange={() => setEditDoc(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Редактировать документ</DialogTitle></DialogHeader>
            {editDoc && (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-1">
                  <Label>Тип документа</Label>
                  <select name="docType" defaultValue={editDoc.docType || ''} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                    {DOC_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Дата выдачи</Label>
                  <Input name="issuedAt" type="date" defaultValue={editDoc.issuedAt ? editDoc.issuedAt.split('T')[0] : ''} />
                </div>
                <div className="space-y-1">
                  <Label>Действует до *</Label>
                  <Input name="validUntil" type="date" required defaultValue={editDoc.validUntil ? editDoc.validUntil.split('T')[0] : ''} />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setEditDoc(null)}>Отмена</Button>
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
            <DialogHeader><DialogTitle>Удалить документ?</DialogTitle></DialogHeader>
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
