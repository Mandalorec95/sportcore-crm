'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { getGroups } from '@/lib/api';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, ChevronRight, Dumbbell, DollarSign } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  sport?: string;
  coach?: { fullName?: string; user?: { fullName?: string } };
  athletesCount?: number;
  monthlyFee?: number;
  schedule?: string;
}

export default function GroupsPage() {
  const router = useRouter();
  const { data: groups = [], isLoading } = useQuery<Group[]>({
    queryKey: ['groups'],
    queryFn: getGroups,
  });

  return (
    <MainLayout allowedRoles={['admin', 'coach']}>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Группы</h1>
          <p className="text-gray-500 mt-1">Спортивные группы клуба</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <Card
                key={group.id}
                className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-blue-500"
                onClick={() => router.push(`/groups/${group.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{group.name}</CardTitle>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                  {group.sport && (
                    <Badge variant="outline" className="w-fit text-xs">
                      {group.sport}
                    </Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>
                      {group.athletesCount ?? 0} спортсменов
                    </span>
                  </div>
                  {(group.coach?.fullName || group.coach?.user?.fullName) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Dumbbell className="h-4 w-4 text-green-500" />
                      <span>{group.coach.fullName || group.coach.user?.fullName}</span>
                    </div>
                  )}
                  {group.monthlyFee && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 text-yellow-500" />
                      <span>{group.monthlyFee.toLocaleString('ru-RU')} ₽/мес</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {groups.length === 0 && (
              <div className="col-span-3 text-center text-gray-500 py-12">
                Группы не найдены
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
