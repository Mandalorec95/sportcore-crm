'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSessions, getSessionAttendance, bulkMarkAttendance, getGroups, getAthletes } from '@/lib/api';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarCheck, Check, X, Thermometer, Users } from 'lucide-react';
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
  athlete?: { id: string; fullName: string };
  athleteId?: string;
  status?: string;
}

interface AthleteRecord {
  id: string;
  fullName: string;
}

interface Group {
  id: string;
  name: string;
}

type AttendanceStatus = 'present' | 'absent' | 'sick';

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});

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
  const currentGroupId = currentSession?.groupId || currentSession?.group?.id;

  // When attendance is empty (not yet marked), fetch group athletes
  const { data: groupAthletes = [] } = useQuery<AthleteRecord[]>({
    queryKey: ['athletes', 'group', currentGroupId],
    queryFn: () => getAthletes({ groupId: currentGroupId }),
    enabled: !!selectedSession && !!currentGroupId && attendance.length === 0 && !attendanceLoading,
  });

  // Build the list of people to display
  // If attendance records exist, use them; otherwise use group athletes
  const displayList: Array<{ id: string; fullName: string; fromAttendance: boolean; status?: string }> =
    attendance.length > 0
      ? attendance.map((r) => ({
          id: r.athlete?.id || r.athleteId || '',
          fullName: r.athlete?.fullName || '—',
          fromAttendance: true,
          status: r.status,
        }))
      : groupAthletes.map((a) => ({
          id: a.id,
          fullName: a.fullName,
          fromAttendance: false,
        }));

  // Sync attendance data into local map when it loads
  useEffect(() => {
    if (attendance.length > 0) {
      const map: Record<string, AttendanceStatus> = {};
      attendance.forEach((r) => {
        const aid = r.athlete?.id || r.athleteId;
        if (aid && r.status) map[aid] = r.status as AttendanceStatus;
      });
      setAttendanceMap(map);
    } else {
      setAttendanceMap({});
    }
  }, [attendance]);

  // Reset attendance map when session changes
  useEffect(() => {
    setAttendanceMap({});
  }, [selectedSession]);

  const saveMutation = useMutation({
    mutationFn: (records: Array<{ athleteId: string; status: string }>) =>
      bulkMarkAttendance(selectedSession!, { records }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Посещаемость сохранена');
    },
    onError: () => toast.error('Ошибка при сохранении'),
  });

  const handleMarkAll = (status: AttendanceStatus) => {
    const newMap: Record<string, AttendanceStatus> = {};
    displayList.forEach((item) => {
      if (item.id) newMap[item.id] = status;
    });
    setAttendanceMap(newMap);
  };

  const handleSave = () => {
    const records = Object.entries(attendanceMap).map(([athleteId, status]) => ({
      athleteId,
      status,
    }));
    if (records.length === 0) {
      toast.error('Отметьте статус хотя бы одного спортсмена');
      return;
    }
    saveMutation.mutate(records);
  };

  const setStatus = (athleteId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({ ...prev, [athleteId]: status }));
  };

  const getSessionTime = (session: Session) => {
    if (session.startTime) return session.startTime;
    const dateStr = session.sessionDate || session.date;
    if (dateStr) {
      return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    return '';
  };

  const getSessionDateDisplay = (session: Session) => {
    const dateStr = session.sessionDate || session.date;
    if (dateStr) return new Date(dateStr).toLocaleDateString('ru-RU');
    return '';
  };

  return (
    <MainLayout allowedRoles={['admin', 'coach']}>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Посещаемость</h1>
          <p className="text-gray-500 mt-1">Отметьте присутствие спортсменов</p>
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
                <Select value={selectedGroup} onValueChange={(v) => { setSelectedGroup(v ?? 'all'); setSelectedSession(null); }}>
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
                    <div className="font-medium text-sm">{session.group?.name || 'Группа'}</div>
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

          {/* Attendance list */}
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
                        onClick={() => handleMarkAll('present')}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Все присутствуют
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={saveMutation.isPending}
                      >
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
                    <div className="divide-y">
                      {displayList.map((item) => {
                        const currentStatus = attendanceMap[item.id] || item.status;

                        return (
                          <div key={item.id} className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                                {item.fullName.charAt(0)}
                              </div>
                              <span className="font-medium text-sm">{item.fullName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {currentStatus && (
                                <span className="mr-2 text-xs text-gray-400">
                                  <StatusBadge status={currentStatus} />
                                </span>
                              )}
                              <button
                                onClick={() => item.id && setStatus(item.id, 'present')}
                                className={`p-2 rounded-lg transition-colors ${
                                  currentStatus === 'present'
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-500'
                                }`}
                                title="Присутствует"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => item.id && setStatus(item.id, 'absent')}
                                className={`p-2 rounded-lg transition-colors ${
                                  currentStatus === 'absent'
                                    ? 'bg-red-100 text-red-600'
                                    : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500'
                                }`}
                                title="Отсутствует"
                              >
                                <X className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => item.id && setStatus(item.id, 'sick')}
                                className={`p-2 rounded-lg transition-colors ${
                                  currentStatus === 'sick'
                                    ? 'bg-orange-100 text-orange-600'
                                    : 'bg-gray-100 text-gray-400 hover:bg-orange-50 hover:text-orange-500'
                                }`}
                                title="Болеет"
                              >
                                <Thermometer className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
