import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoachesService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string) {
    const coaches = await this.prisma.coach.findMany({
      where: { orgId },
      include: {
        user: true,
        groups: {
          include: { _count: { select: { athletes: true } } },
        },
      },
    });

    return coaches.map((c) => ({
      id: c.id,
      userId: c.userId,
      fullName: c.user.fullName,
      email: c.user.email,
      sportTypes: c.sportTypes,
      groupsCount: c.groups.length,
      athletesCount: c.groups.reduce((sum, g) => sum + g._count.athletes, 0),
      groups: c.groups.map((g) => ({ id: g.id, name: g.name })),
    }));
  }

  async findOne(id: string, orgId: string) {
    const coach = await this.prisma.coach.findFirst({
      where: { id, orgId },
      include: {
        user: true,
        groups: {
          include: {
            schedules: true,
            _count: { select: { athletes: true } },
          },
        },
      },
    });
    if (!coach) throw new NotFoundException('Тренер не найден');
    return coach;
  }

  async getTodaySessions(coachId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.trainingSession.findMany({
      where: {
        coachId,
        sessionDate: { gte: today, lt: tomorrow },
      },
      include: {
        group: {
          include: { athletes: { where: { status: { not: 'archived' } } } },
        },
        _count: { select: { attendances: true } },
      },
      orderBy: { startTime: 'asc' },
    });
  }
}
