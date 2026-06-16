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
  requestParentConsent,
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
import { formatDate } from '@/lib/utils';
import { FileWarning, Plus, Trash2, Edit, Search } from 'lucide-react';
import { toast } from 'sonner';

interface MedDocument {
  id: string;
  athlete?: { id?: string; firstName?: string; lastName?: string; fullName?: string; group?: { name?: string } };
  docType?: string;
  issuedAt?: string;
  validUntil?: string;
  daysLeft?: number;
  status?: string;
  requestedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  requestedByUserId?: string;
  approvedByParentId?: string;
}

interface Athlete {
  id: string;
  fullName: string;
}

const DOC_TYPES = [
  { value: 'medical_cert', label: 'Медицинская справка' },
  { value: 'parental_consent', label: 'Родительское согласие' },
];

const MEDICAL_CERT_DOC_TYPE = 'medical_cert';
const PARENT_CONSENT_DOC_TYPE = 'parental_consent';
const MEDICAL_CERT_LABEL = 'Медицинская справка';
const PARENT_CONSENT_LABEL = 'Родительское согласие';

const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  valid: 'действует действительно',
  expires_soon: 'истекает скоро требует внимания',
  expired: 'истекло просрочено',
  pending: 'ожидание ожидает подтверждения запрос отправлен',
  approved: 'подтверждено согласие получено',
  rejected: 'отклонено отказ',
};

const normalizeSearch = (value?: string | number | null) =>
  String(value ?? '').toLowerCase().trim();

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
  const [search, setSearch] = useState('');
  const [athleteSearch, setAthleteSearch] = useState('');
  const [createDocType, setCreateDocType] = useState(MEDICAL_CERT_DOC_TYPE);

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

  const normalizedSearch = normalizeSearch(search);

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => createMedicalDocument(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-documents'] });
      queryClient.invalidateQueries({ queryKey: ['expiring-docs'] });
      setShowCreate(false);
      setAthleteSearch('');
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
      toast.success('Документ успешно обновлён');
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Ошибка при обновлении'),
  });

  const consentRequestMutation = useMutation({
    mutationFn: (athleteId: string) => requestParentConsent(athleteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-documents'] });
      queryClient.invalidateQueries({ queryKey: ['expiring-docs'] });
      setShowCreate(false);
      setAthleteSearch('');
      setCreateDocType(MEDICAL_CERT_DOC_TYPE);
      toast.success('Запрос родителю отправлен');
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Не удалось отправить запрос родителю'),
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
    const athlete = athletes.find(
      (a) => a.id === athleteSearch || normalizeSearch(a.fullName) === normalizeSearch(athleteSearch),
    );

    if (!athlete) {
      toast.error('Выберите ученика из списка');
      return;
    }

    if (createDocType === PARENT_CONSENT_DOC_TYPE) {
      consentRequestMutation.mutate(athlete.id);
      return;
    }

    createMutation.mutate({
      athleteId: athlete.id,
      docType: MEDICAL_CERT_DOC_TYPE,
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
        docType: MEDICAL_CERT_DOC_TYPE,
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

  const getDocTypeLabel = (docType?: string) =>
    DOC_TYPES.find((type) => type.value === docType)?.label
      ?? (docType === 'medical_certificate' ? MEDICAL_CERT_LABEL : docType || '—');

  const isMedicalCertDoc = (doc: MedDocument) =>
    !doc.docType || doc.docType === MEDICAL_CERT_DOC_TYPE || doc.docType === 'medical_certificate';

  const isParentConsentDoc = (doc: MedDocument) => doc.docType === PARENT_CONSENT_DOC_TYPE;

  const filterDocuments = (docs: MedDocument[]) => docs.filter((doc) => {
    if (!normalizedSearch) return true;
    const daysLeft = doc.validUntil ? getDaysLeft(doc.validUntil) : (doc.daysLeft ?? null);
    const searchable = [
      getAthleteFullName(doc),
      doc.athlete?.group?.name,
      getDocTypeLabel(doc.docType),
      doc.issuedAt,
      doc.validUntil,
      doc.requestedAt,
      doc.approvedAt,
      doc.rejectedAt,
      daysLeft,
      doc.status,
      doc.status ? DOCUMENT_STATUS_LABELS[doc.status] : '',
    ].join(' ');
    return normalizeSearch(searchable).includes(normalizedSearch);
  });

  const filteredAllDocs = filterDocuments(allDocs);
  const filteredExpiringDocs = filterDocuments(expiringDocs);

  const DocTable = ({ docs, isLoading }: { docs: MedDocument[]; isLoading: boolean }) => (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : docs.length === 0 ? (
          <div className={`text-center py-12 ${normalizedSearch ? 'text-gray-500' : 'text-green-600'}`}>
            <FileWarning className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">{normalizedSearch ? 'Ничего не найдено' : 'Нет документов'}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Спортсмен</TableHead>
                <TableHead>Группа</TableHead>
                <TableHead>Тип</TableHead>
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
                    <TableCell>{getDocTypeLabel(doc.docType)}</TableCell>
                    <TableCell>{isParentConsentDoc(doc) ? formatDate(doc.requestedAt) : formatDate(doc.issuedAt)}</TableCell>
                    <TableCell>{isParentConsentDoc(doc) ? formatDate(doc.approvedAt || doc.rejectedAt) : formatDate(doc.validUntil)}</TableCell>
                    <TableCell>
                      {isParentConsentDoc(doc) ? (
                        doc.status === 'approved' ? 'согласие получено' : doc.status === 'pending' ? 'ожидает ответа' : '—'
                      ) : daysLeft != null ? (
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
                        {isMedicalCertDoc(doc) && (
                          <Button size="sm" variant="ghost" onClick={() => setEditDoc(doc)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
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
            <p className="text-gray-500 mt-1">Контроль медсправок и родительских согласий</p>
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
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <TabsList>
              <TabsTrigger value="all">Все документы ({filteredAllDocs.length})</TabsTrigger>
              <TabsTrigger value="expiring" className="text-yellow-600">
                Требуют внимания ({filteredExpiringDocs.length})
              </TabsTrigger>
            </TabsList>
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по ученику или группе..."
                className="pl-9"
              />
            </div>
          </div>

          <TabsContent value="all">
            <DocTable docs={filteredAllDocs} isLoading={allLoading} />
          </TabsContent>

          <TabsContent value="expiring">
            <DocTable docs={filteredExpiringDocs} isLoading={expiringLoading} />
          </TabsContent>
        </Tabs>

        {/* Create Dialog */}
        <Dialog
          open={showCreate}
          onOpenChange={(open) => {
            setShowCreate(open);
            if (!open) {
              setAthleteSearch('');
              setCreateDocType(MEDICAL_CERT_DOC_TYPE);
            }
          }}
        >
          <DialogContent>
            <DialogHeader><DialogTitle>Добавить документ</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="athleteSearch">Ученик *</Label>
                <Input
                  id="athleteSearch"
                  list="medical-document-athletes"
                  value={athleteSearch}
                  onChange={(e) => setAthleteSearch(e.target.value)}
                  placeholder="Начните вводить имя или фамилию"
                  required
                />
                <datalist id="medical-document-athletes">
                  {athletes.map((a) => (
                    <option key={a.id} value={a.fullName} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1">
                <Label htmlFor="docType">Тип документа *</Label>
                <select
                  id="docType"
                  value={createDocType}
                  onChange={(e) => setCreateDocType(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  {DOC_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              {createDocType === MEDICAL_CERT_DOC_TYPE ? (
                <>
                  <div className="space-y-1">
                    <Label>Дата выдачи</Label>
                    <Input name="issuedAt" type="date" />
                  </div>
                  <div className="space-y-1">
                    <Label>Действует до *</Label>
                    <Input name="validUntil" type="date" required />
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                  Родителю будет отправлено уведомление с просьбой подтвердить допуск ребёнка к занятиям.
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Отмена</Button>
                <Button type="submit" disabled={createMutation.isPending || consentRequestMutation.isPending}>
                  {createDocType === PARENT_CONSENT_DOC_TYPE
                    ? consentRequestMutation.isPending ? 'Отправка...' : 'Отправить запрос родителю'
                    : createMutation.isPending ? 'Сохранение...' : 'Добавить'}
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
