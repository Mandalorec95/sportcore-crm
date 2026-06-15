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
        update: { status: item.status as any, grade: item.grade ?? null, comment: item.comment, createdBy: userId },
        create: {
          sessionId,
          athleteId: item.athleteId,
          status: item.status as any,
          grade: item.grade ?? null,
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
    const grades = all.filter((a) => a.grade != null).map((a) => a.grade as number);
    const avgGrade = grades.length > 0 ? Math.round((grades.reduce((s, g) => s + g, 0) / grades.length) * 10) / 10 : null;
    return {
      total: all.length,
      present,
      absent: all.filter((a) => a.status === 'absent').length,
      sick: all.filter((a) => a.status === 'sick').length,
      rate: all.length > 0 ? Math.round((present / all.length) * 100) : 0,
      avgGrade,
    };
  }

  async getAllAthletesReadiness(orgId: string) {
    const athletes = await this.prisma.athlete.findMany({
      where: { orgId, status: { not: 'archived' } },
      select: { id: true, firstName: true, lastName: true, attendances: { select: { status: true, grade: true } } },
    });

    return athletes.map((a) => {
      const total = a.attendances.length;
      const present = a.attendances.filter((x) => x.status === 'present' || x.status === 'late').length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;
      const grades = a.attendances.filter((x) => x.grade != null).map((x) => x.grade as number);
      const avgGrade = grades.length > 0 ? Math.round((grades.reduce((s, g) => s + g, 0) / grades.length) * 10) / 10 : null;

      let readiness: 'green' | 'yellow' | 'red';
      if (rate >= 80 && (avgGrade == null || avgGrade >= 4)) readiness = 'green';
      else if (rate < 50 || (avgGrade != null && avgGrade < 3)) readiness = 'red';
      else readiness = 'yellow';

      return { id: a.id, fullName: `${a.firstName} ${a.lastName}`, rate, avgGrade, readiness };
    });
  }
}
