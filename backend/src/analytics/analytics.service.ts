import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(orgId: string) {
    const [totalAthletes, activeAthletes, groups, debtPayments, expiringDocs, upcomingComps, todaySessions] =
      await Promise.all([
        this.prisma.athlete.count({ where: { orgId, status: { not: 'archived' } } }),
        this.prisma.athlete.count({ where: { orgId, status: 'active' } }),
        this.prisma.trainingGroup.count({ where: { orgId } }),
        this.prisma.payment.findMany({
          where: { orgId, status: { in: ['debt', 'partial'] } },
          select: { amount: true, paidAmount: true },
        }),
        this.prisma.medicalDocument.count({
          where: {
            athlete: { orgId },
            status: { in: ['expires_soon', 'expired'] },
          },
        }),
        this.prisma.competition.findMany({
          where: { orgId, compDate: { gte: new Date() } },
          orderBy: { compDate: 'asc' },
          take: 3,
        }),
        (() => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          return this.prisma.trainingSession.count({
            where: { group: { orgId }, sessionDate: { gte: today, lt: tomorrow } },
          });
        })(),
      ]);

    const totalDebt = debtPayments.reduce((s, p) => s + (p.amount - p.paidAmount), 0);

    return {
      totalAthletes,
      activeAthletes,
      groups,
      debtors: debtPayments.length,
      totalDebt,
      expiringDocs,
      todaySessions,
      upcomingCompetitions: upcomingComps,
    };
  }

  async getAthleteRisk(athleteId: string, orgId: string) {
    const athlete = await this.prisma.athlete.findFirst({ where: { id: athleteId, orgId } });
    if (!athlete) return { athleteId, risk: 0, factors: [] };

    const [attendances, debtPayments] = await Promise.all([
      this.prisma.attendance.findMany({
        where: { athleteId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.payment.findFirst({ where: { athleteId, status: { in: ['debt', 'partial'] } } }),
    ]);

    const present = attendances.filter((a) => a.status === 'present' || a.status === 'late').length;
    const rate = attendances.length > 0 ? (present / attendances.length) * 100 : 100;

    let risk = 0;
    const factors: string[] = [];

    if (rate < 50) { risk += 35; factors.push('Посещаемость ниже 50%'); }
    else if (rate < 70) { risk += 20; factors.push('Низкая посещаемость'); }
    else if (rate < 85) { risk += 10; factors.push('Посещаемость ниже нормы'); }

    if (debtPayments) { risk += 20; factors.push('Есть задолженность'); }

    const consecAbsent = this.countConsecutiveAbsent(attendances);
    if (consecAbsent >= 3) { risk += 20; factors.push(`${consecAbsent} пропусков подряд`); }
    else if (consecAbsent >= 2) { risk += 10; }

    return { athleteId, attendanceRate: Math.round(rate), risk: Math.min(risk, 100), factors };
  }

  private countConsecutiveAbsent(attendances: any[]): number {
    let count = 0;
    for (const a of attendances) {
      if (a.status === 'absent') count++;
      else break;
    }
    return count;
  }
}
