import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async getSessionAttendance(sessionId: string) {
    return this.prisma.attendance.findMany({
      where: { sessionId },
      include: { athlete: true },
    });
  }

  async getAthleteAttendance(athleteId: string, orgId: string) {
    return this.prisma.attendance.findMany({
      where: { athleteId, athlete: { orgId } },
      include: { session: { include: { group: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async bulkCreate(sessionId: string, dto: BulkAttendanceDto, userId: string) {
    const ops = dto.items.map((item) =>
      this.prisma.attendance.upsert({
        where: { sessionId_athleteId: { sessionId, athleteId: item.athleteId } },
        update: { status: item.status as any, comment: item.comment, createdBy: userId },
        create: {
          sessionId,
          athleteId: item.athleteId,
          status: item.status as any,
          comment: item.comment,
          createdBy: userId,
        },
      }),
    );
    await Promise.all(ops);

    await this.prisma.trainingSession.update({
      where: { id: sessionId },
      data: { status: 'completed' },
    });

    return { sessionId, updated: dto.items.length };
  }

  async getAthleteStats(athleteId: string, orgId: string) {
    const all = await this.prisma.attendance.findMany({
      where: { athleteId, athlete: { orgId } },
    });
    const present = all.filter((a) => a.status === 'present' || a.status === 'late').length;
    return {
      total: all.length,
      present,
      absent: all.filter((a) => a.status === 'absent').length,
      sick: all.filter((a) => a.status === 'sick').length,
      rate: all.length > 0 ? Math.round((present / all.length) * 100) : 0,
    };
  }
}
