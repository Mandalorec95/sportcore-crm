'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiKeys, createApiKey, deleteApiKey } from '@/lib/api';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Key, Plus, Copy, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  name: string;
  prefix?: string;
  scopes?: string[];
  createdAt?: string;
  lastUsedAt?: string;
  isActive?: boolean;
}

const AVAILABLE_SCOPES = [
  { value: 'athletes:read', label: 'Чтение спортсменов' },
  { value: 'athletes:write', label: 'Запись спортсменов' },
  { value: 'groups:read', label: 'Чтение групп' },
  { value: 'payments:read', label: 'Чтение оплат' },
  { value: 'payments:write', label: 'Запись оплат' },
  { value: 'attendance:read', label: 'Чтение посещаемости' },
  { value: 'attendance:write', label: 'Запись посещаемости' },
  { value: 'documents:read', label: 'Чтение документов' },
];

export default function ApiKeysPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: apiKeys = [], isLoading } = useQuery<ApiKey[]>({
    queryKey: ['api-keys'],
    queryFn: getApiKeys,
  });

  const createMutation = useMutation({
    mutationFn: () => createApiKey({ name: newKeyName, scopes: selectedScopes }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      if (data.key || data.token || data.apiKey) {
        setGeneratedKey(data.key || data.token || data.apiKey);
      }
      setShowCreate(false);
      toast.success('API ключ создан');
    },
    onError: () => toast.error('Ошибка при создании ключа'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteApiKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setDeleteId(null);
      toast.success('Ключ отозван');
    },
    onError: () => toast.error('Ошибка при отзыве ключа'),
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const handleCreate = () => {
    if (!newKeyName.trim()) {
      toast.error('Введите название ключа');
      return;
    }
    createMutation.mutate();
  };

  const openCreate = () => {
    setNewKeyName('');
    setSelectedScopes([]);
    setShowCreate(true);
  };

  return (
    <MainLayout allowedRoles={['admin']}>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">API / Интеграции</h1>
            <p className="text-gray-500 mt-1">Управление API-ключами для интеграций</p>
          </div>
          <Button onClick={openCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Создать ключ
          </Button>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-700">
          <strong>Важно:</strong> API-ключи показываются только один раз при создании. Сохраните ключ в надёжном месте.
        </div>

        {/* Keys table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <Key className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Нет API-ключей. Создайте первый!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Префикс</TableHead>
                    <TableHead>Права доступа</TableHead>
                    <TableHead>Создан</TableHead>
                    <TableHead>Последнее использование</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell>
                        {key.prefix ? (
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">{key.prefix}...</code>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {key.scopes?.slice(0, 3).map((s) => (
                            <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                          ))}
                          {(key.scopes?.length ?? 0) > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{(key.scopes?.length ?? 0) - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {key.createdAt ? new Date(key.createdAt).toLocaleDateString('ru-RU') : '—'}
                      </TableCell>
                      <TableCell>
                        {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString('ru-RU') : 'Никогда'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={key.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}
                          variant="outline"
                        >
                          {key.isActive !== false ? 'Активен' : 'Неактивен'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteId(key.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Modal */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Создать API-ключ</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Название *</Label>
                <Input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Интеграция с Telegram-ботом"
                />
              </div>
              <div className="space-y-2">
                <Label>Права доступа</Label>
                <div className="space-y-2 max-h-52 overflow-y-auto border rounded-lg p-3">
                  {AVAILABLE_SCOPES.map((scope) => (
                    <div key={scope.value} className="flex items-center gap-2">
                      <Checkbox
                        id={scope.value}
                        checked={selectedScopes.includes(scope.value)}
                        onCheckedChange={() => toggleScope(scope.value)}
                      />
                      <label htmlFor={scope.value} className="text-sm cursor-pointer">
                        {scope.label}
                        <span className="text-gray-400 ml-1 text-xs">({scope.value})</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowCreate(false)}>Отмена</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Создание...' : 'Создать'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Generated Key Modal */}
        <Dialog open={!!generatedKey} onOpenChange={() => { setGeneratedKey(null); setCopied(false); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>API-ключ создан</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
                Сохраните ключ сейчас — он больше не будет показан!
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-gray-100 px-3 py-2 rounded-lg break-all">
                  {generatedKey}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => generatedKey && handleCopy(generatedKey)}
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                className="w-full"
                onClick={() => { setGeneratedKey(null); setCopied(false); }}
              >
                Закрыть
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Отозвать ключ?</AlertDialogTitle>
              <AlertDialogDescription>
                Этот ключ будет немедленно отозван. Все интеграции, использующие его, перестанут работать.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                className="bg-red-600 hover:bg-red-700"
              >
                Отозвать
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
