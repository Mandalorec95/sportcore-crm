'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSessions, getSessionAttendance, bulkMarkAttendance, getGroups, getAthletes } from '@/lib/api';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarCheck, Users, X } from 'lucide-react';
import { toast } from 'sonner';

interface Session {
  id: string;
  sessionDate?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  groupId?: string;
  group?: { id: string; name: string };
  topic?: string;
}

interface AttendanceRecord {
  id?: string;
  athlete?: { id: string; firstName?: string; lastName?: string; fullName?: string };
  athleteId?: string;
  status?: string;
  grade?: number | null;
}

interface AthleteRecord {
  id: string;
  fullName: string;
}

interface Group {
  id: string;
  name: string;
}

interface DisplayItem {
  id: string;
  fullName: string;
  status?: string;
  grade?: number | null;
}

interface AttendanceEntry {
  status: 'present' | 'absent' | 'sick';
  grade: number | null;
}

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [entryMap, setEntryMap] = useState<Record<string, AttendanceEntry>>({});

  const { data: groups = [] } = useQuery<Group[]>({
    queryKey: ['groups'],
    queryFn: getGroups,
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<Session[]>({
    queryKey: ['sessions', selectedGroup, selectedDate],
    queryFn: () =>
      getSessions({
        date: selectedDate,
        groupId: selectedGroup !== 'all' ? selectedGroup : undefined,
      }),
  });

  const { data: attendance = [], isLoading: attendanceLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ['attendance', selectedSession],
    queryFn: () => getSessionAttendance(selectedSession!),
    enabled: !!selectedSession,
  });

  const currentSession = sessions.find((s) => s.id === selectedSession);
  const currentGroupId = currentSession?.groupId ?? currentSession?.group?.id;

  const { data: groupAthletes = [] } = useQuery<AthleteRecord[]>({
    queryKey: ['athletes', 'group', currentGroupId],
    queryFn: () => getAthletes({ groupId: currentGroupId }),
    enabled: !!selectedSession && !!currentGroupId && attendance.length === 0 && !attendanceLoading,
  });

  const getAthleteFullName = (r: AttendanceRecord) => {
    if (r.athlete?.fullName) return r.athlete.fullName;
    if (r.athlete?.firstName || r.athlete?.lastName) {
      return `${r.athlete.firstName ?? ''} ${r.athlete.lastName ?? ''}`.trim();
    }
    return '—';
  };

  const displayList: DisplayItem[] =
    attendance.length > 0
      ? attendance.map((r) => ({
          id: r.athlete?.id ?? r.athleteId ?? '',
          fullName: getAthleteFullName(r),
          status: r.status,
          grade: r.grade,
        }))
      : groupAthletes.map((a) => ({
          id: a.id,
          fullName: a.fullName ?? '—',
        }));

  useEffect(() => {
    if (attendance.length > 0) {
      const map: Record<string, AttendanceEntry> = {};
      attendance.forEach((r) => {
        const aid = r.athlete?.id ?? r.athleteId;
        if (aid) {
          map[aid] = {
            status: (r.status as AttendanceEntry['status']) ?? 'present',
            grade: r.grade ?? null,
          };
        }
      });
      setEntryMap(map);
    } else {
      setEntryMap({});
    }
  }, [attendance]);

  useEffect(() => {
    setEntryMap({});
  }, [selectedSession]);

  const saveMutation = useMutation({
    mutationFn: (items: Array<{ athleteId: string; status: string; grade?: number | null }>) =>
      bulkMarkAttendance(selectedSession!, { items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Посещаемость сохранена');
    },
    onError: () => toast.error('Ошибка при сохранении'),
  });

  const handleMarkAllPresent = () => {
    const newMap: Record<string, AttendanceEntry> = {};
    displayList.forEach((item) => {
      if (item.id) newMap[item.id] = { status: 'present', grade: null };
    });
    setEntryMap(newMap);
  };

  const handleSave = () => {
    const items = Object.entries(entryMap).map(([athleteId, entry]) => ({
      athleteId,
      status: entry.status,
      grade: entry.grade ?? undefined,
    }));
    if (items.length === 0) {
      toast.error('Отметьте хотя бы одного спортсмена');
      return;
    }
    saveMutation.mutate(items);
  };

  const setStatus = (athleteId: string, status: 'present' | 'absent' | 'sick') => {
    setEntryMap((prev) => ({
      ...prev,
      [athleteId]: { ...(prev[athleteId] ?? { grade: null }), status },
    }));
  };

  const setGrade = (athleteId: string, grade: number | null) => {
    setEntryMap((prev) => ({
      ...prev,
      [athleteId]: { ...(prev[athleteId] ?? { status: 'present' }), grade, status: 'present' },
    }));
  };

  const getSessionTime = (session: Session) => {
    if (session.startTime) return session.startTime;
    const dateStr = session.sessionDate ?? session.date;
    if (dateStr) {
      try {
        return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      } catch {
        return '';
      }
    }
    return '';
  };

  const getSessionDateDisplay = (session: Session) => {
    const dateStr = session.sessionDate ?? session.date;
    if (dateStr) {
      try {
        return new Date(dateStr).toLocaleDateString('ru-RU');
      } catch {
        return dateStr;
      }
    }
    return '';
  };

  return (
    <MainLayout allowedRoles={['admin', 'coach']}>
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Посещаемость</h1>
          <p className="text-gray-500 mt-1">Журнал посещаемости и оценок</p>
        </div>

        {/* Filters */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Дата</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSession(null);
                  }}
                  className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Группа</label>
                <Select
                  modal={false}
                  value={selectedGroup}
                  onValueChange={(v) => { setSelectedGroup(v ?? 'all'); setSelectedSession(null); }}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Все группы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все группы</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Sessions list */}
          <div className="space-y-2">
            <h3 className="font-medium text-gray-700 text-sm">Тренировки</h3>
            {sessionsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            ) : sessions.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-center text-gray-500 text-sm">
                  Нет тренировок за выбранную дату
                </CardContent>
              </Card>
            ) : (
              sessions.map((session) => (
                <Card
                  key={session.id}
                  className={`cursor-pointer transition-colors ${
                    selectedSession === session.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedSession(session.id)}
                >
                  <CardContent className="p-4">
                    <div className="font-medium text-sm">{session.group?.name ?? 'Группа'}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {getSessionTime(session)}
                      {session.startTime && session.endTime && ` – ${session.endTime}`}
                    </div>
                    {session.topic && (
                      <div className="text-xs text-gray-400 mt-1 truncate">{session.topic}</div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Attendance journal */}
          <div className="lg:col-span-2">
            {!selectedSession ? (
              <Card>
                <CardContent className="p-12 text-center text-gray-400">
                  <CalendarCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Выберите тренировку для отметки посещаемости</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <CardTitle className="text-base">{currentSession?.group?.name}</CardTitle>
                      <p className="text-sm text-gray-500">
                        {currentSession && getSessionDateDisplay(currentSession)}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleMarkAllPresent}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Все присутствуют
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {attendanceLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                    </div>
                  ) : displayList.length === 0 ? (
                    <div className="text-center text-gray-500 py-8 text-sm">
                      Нет спортсменов в этой группе
                    </div>
                  ) : (
                    <>
                      {/* Header row */}
                      <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 border-b">
                        <span>Спортсмен</span>
                        <span className="w-28 text-center">Оценка (1–5)</span>
                        <span className="w-24 text-center">Статус</span>
                      </div>
                      <div className="divide-y overflow-x-auto">
                        {displayList.map((item) => {
                          const entry = entryMap[item.id];
                          const currentStatus = entry?.status ?? (item.status as AttendanceEntry['status']) ?? undefined;
                          const currentGrade = entry?.grade ?? item.grade ?? null;

                          return (
                            <div key={item.id} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center px-4 py-3 min-w-[380px]">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                                  {(item.fullName ?? '?').charAt(0)}
                                </div>
                                <span className="font-medium text-sm truncate">{item.fullName}</span>
                              </div>

                              {/* Grade selector */}
                              <div className="flex items-center gap-1 w-28 justify-center">
                                {currentStatus === 'absent' ? (
                                  <span className="text-xs text-red-400">не был</span>
                                ) : (
                                  [1, 2, 3, 4, 5].map((g) => (
                                    <button
                                      key={g}
                                      onClick={() => setGrade(item.id, currentGrade === g ? null : g)}
                                      className={`w-6 h-6 rounded text-xs font-bold transition-colors ${
                                        currentGrade === g
                                          ? g >= 4 ? 'bg-green-500 text-white' : g === 3 ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
                                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                      }`}
                                    >
                                      {g}
                                    </button>
                                  ))
                                )}
                              </div>

                              {/* Status: present / absent / sick */}
                              <div className="flex items-center gap-1 w-24 justify-center">
                                <button
                                  onClick={() => setStatus(item.id, 'present')}
                                  title="Присутствует"
                                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                    currentStatus === 'present' || (!currentStatus && currentGrade != null)
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-400 hover:bg-green-50'
                                  }`}
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => setStatus(item.id, 'absent')}
                                  title="Отсутствует"
                                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                    currentStatus === 'absent'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-gray-100 text-gray-400 hover:bg-red-50'
                                  }`}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => setStatus(item.id, 'sick')}
                                  title="Болеет"
                                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                    currentStatus === 'sick'
                                      ? 'bg-orange-100 text-orange-700'
                                      : 'bg-gray-100 text-gray-400 hover:bg-orange-50'
                                  }`}
                                >
                                  🤒
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
