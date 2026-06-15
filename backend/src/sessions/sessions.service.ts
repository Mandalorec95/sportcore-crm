import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string, query: any = {}) {
    const where: any = { group: { orgId } };
    if (query.groupId) where.groupId = query.groupId;
    if (query.date) where.sessionDate = new Date(query.date);
    if (query.coachId) where.coachId = query.coachId;

    return this.prisma.trainingSession.findMany({
      where,
      include: {
        group: true,
        coach: { include: { user: true } },
        _count: { select: { attendances: true } },
      },
      orderBy: [{ sessionDate: 'desc' }, { startTime: 'asc' }],
    });
  }

  async findOne(id: string, orgId: string) {
    const session = await this.prisma.trainingSession.findFirst({
      where: { id, group: { orgId } },
      include: {
        group: { include: { athletes: { where: { status: { not: 'archived' } } } } },
        coach: { include: { user: true } },
        attendances: { include: { athlete: true } },
      },
    });
    if (!session) throw new NotFoundException('Тренировка не найдена');
    return session;
  }

  async create(dto: CreateSessionDto, orgId: string) {
    return this.prisma.trainingSession.create({
      data: {
        ...dto,
        sessionDate: new Date(dto.sessionDate),
      },
      include: { group: true, coach: { include: { user: true } } },
    });
  }

  async update(id: string, data: any, orgId: string) {
    await this.findOne(id, orgId);
    return this.prisma.trainingSession.update({
      where: { id },
      data,
      include: { group: true },
    });
  }

  async getTodaySessions(orgId: string, coachId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: any = {
      group: { orgId },
      sessionDate: { gte: today, lt: tomorrow },
    };
    if (coachId) where.coachId = coachId;

    return this.prisma.trainingSession.findMany({
      where,
      include: {
        group: true,
        coach: { include: { user: true } },
        _count: { select: { attendances: true } },
      },
      orderBy: { startTime: 'asc' },
    });
  }
}
