import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAthleteDto } from './dto/create-athlete.dto';
import { UpdateAthleteDto } from './dto/update-athlete.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AthletesService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string, query: any = {}) {
    const where: any = { orgId };
    if (query.groupId) where.groupId = query.groupId;
    if (query.status) where.status = query.status;
    else where.status = { not: 'archived' };

    const athletes = await this.prisma.athlete.findMany({
      where,
      include: {
        group: { include: { coach: { include: { user: true } } } },
        athleteParents: { include: { parent: { include: { user: true } } } },
        medicalDocuments: { orderBy: { validUntil: 'desc' }, take: 2 },
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { attendances: true } },
      },
      orderBy: { lastName: 'asc' },
    });

    return athletes.map((a) => this.mapAthleteList(a));
  }

  async findOne(id: string, orgId: string) {
    const athlete = await this.prisma.athlete.findFirst({
      where: { id, orgId },
      include: {
        group: { include: { coach: { include: { user: true } }, schedules: true } },
        athleteParents: { include: { parent: { include: { user: true } } } },
        medicalDocuments: { orderBy: { validUntil: 'desc' } },
        payments: { orderBy: { createdAt: 'desc' } },
        competitionResults: { include: { competition: true }, orderBy: { createdAt: 'desc' } },
        progressRecords: { orderBy: { measuredAt: 'desc' } },
        attendances: { include: { session: true }, orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!athlete) throw new NotFoundException('Спортсмен не найден');
    return athlete;
  }

  async getSportPassport(id: string, orgId: string) {
    const athlete = await this.findOne(id, orgId);

    const totalSessions = await this.prisma.trainingSession.count({
      where: { groupId: athlete.groupId ?? undefined, status: 'completed' },
    });
    const attended = athlete.attendances.filter((a) => a.status === 'present' || a.status === 'late').length;
    const attendanceRate = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;

    const debtPayment = athlete.payments.find((p) => p.status === 'debt' || p.status === 'partial');
    const medValid = athlete.medicalDocuments.find((d) => d.docType === 'medical_cert');
    const medStatus = medValid?.status ?? 'none';

    const lastProgress = athlete.progressRecords.slice(0, 5);
    const avgScore = lastProgress.length
      ? Math.round(lastProgress.reduce((s, r) => s + r.score, 0) / lastProgress.length)
      : 0;

    const churnRisk = this.calcChurnRisk(attendanceRate, !!debtPayment);
    const competitionReadiness = this.calcReadiness(attendanceRate, avgScore, medStatus);

    return {
      athlete: {
        id: athlete.id,
        fullName: `${athlete.firstName} ${athlete.lastName}`,
        birthDate: athlete.birthDate,
        sportType: athlete.sportType,
        level: athlete.level,
        status: athlete.status,
        group: athlete.group?.name ?? null,
        coach: athlete.group?.coach?.user?.fullName ?? null,
      },
      attendanceRate,
      paymentStatus: debtPayment ? 'debt' : 'paid',
      medicalStatus: medStatus,
      churnRiskScore: churnRisk,
      competitionReadinessScore: competitionReadiness,
      parents: athlete.athleteParents.map((ap) => ({
        fullName: ap.parent.user.fullName,
        phone: ap.parent.phone,
        relation: ap.parent.relation,
      })),
      recentProgress: lastProgress,
      competitions: athlete.competitionResults.slice(0, 5).map((cr) => ({
        name: cr.competition.name,
        date: cr.competition.compDate,
        place: cr.place,
        medal: cr.medal,
        result: cr.result,
      })),
      medicalDocuments: athlete.medicalDocuments,
      payments: athlete.payments.slice(0, 6),
    };
  }

  async create(dto: CreateAthleteDto, orgId: string) {
    const { parent: parentDto, ...athleteData } = dto;

    const athlete = await this.prisma.$transaction(async (tx) => {
      const a = await tx.athlete.create({
        data: {
          ...athleteData,
          orgId,
          birthDate: new Date(athleteData.birthDate),
        },
      });

      if (parentDto) {
        const existing = await tx.user.findUnique({ where: { email: parentDto.email ?? `parent_${a.id}@sportcrm.local` } });
        let parentUser = existing;
        if (!parentUser) {
          const hash = await bcrypt.hash('demo123', 10);
          parentUser = await tx.user.create({
            data: {
              orgId,
              email: parentDto.email ?? `parent_${a.id}@sportcrm.local`,
              passwordHash: hash,
              fullName: parentDto.fullName,
              role: 'parent',
            },
          });
        }

        const parent = await tx.parent.upsert({
          where: { userId: parentUser.id },
          update: { phone: parentDto.phone },
          create: {
            userId: parentUser.id,
            orgId,
            phone: parentDto.phone,
            relation: parentDto.relation ?? 'mother',
          },
        });

        await tx.athleteParent.create({
          data: { athleteId: a.id, parentId: parent.id, isPrimary: true },
        });
      }

      return a;
    });

    return this.findOne(athlete.id, orgId);
  }

  async update(id: string, dto: UpdateAthleteDto, orgId: string) {
    await this.findOne(id, orgId);
    const { birthDate, ...rest } = dto;
    await this.prisma.athlete.update({
      where: { id },
      data: {
        ...rest,
        ...(birthDate ? { birthDate: new Date(birthDate) } : {}),
      },
    });
    return this.findOne(id, orgId);
  }

  async remove(id: string, orgId: string, user?: any) {
    const athlete = await this.prisma.athlete.findFirst({
      where: { id, orgId },
      include: {
        group: { include: { coach: true } },
      },
    });
    if (!athlete) throw new NotFoundException('Спортсмен не найден');

    const canDelete =
      user?.role === 'admin' ||
      (user?.role === 'coach' && athlete.group?.coach?.userId === user?.sub);

    if (!canDelete) {
      throw new ForbiddenException('Недостаточно прав для удаления спортсмена');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.competitionApproval.deleteMany({ where: { athleteId: id } });
      await tx.competitionResult.deleteMany({ where: { athleteId: id } });
      await tx.progressRecord.deleteMany({ where: { athleteId: id } });
      await tx.attendance.deleteMany({ where: { athleteId: id } });
      await tx.medicalDocument.deleteMany({ where: { athleteId: id } });
      await tx.payment.deleteMany({ where: { athleteId: id } });
      await tx.athleteParent.deleteMany({ where: { athleteId: id } });
      await tx.athlete.delete({ where: { id } });
    });

    return { success: true };
  }

  private calcChurnRisk(attendanceRate: number, hasDebt: boolean): number {
    let risk = 0;
    if (attendanceRate < 50) risk += 35;
    else if (attendanceRate < 70) risk += 20;
    else if (attendanceRate < 85) risk += 10;
    if (hasDebt) risk += 20;
    return Math.min(risk, 100);
  }

  private calcReadiness(attendanceRate: number, avgScore: number, medStatus: string): number {
    let score = 0;
    score += (attendanceRate / 100) * 35;
    score += (avgScore / 5) * 25;
    if (medStatus === 'valid') score += 15;
    else if (medStatus === 'expires_soon') score += 8;
    if (attendanceRate >= 85) score += 15;
    else if (attendanceRate >= 70) score += 8;
    return Math.round(Math.min(score, 100));
  }

  private mapAthleteList(a: any) {
    const medDoc = a.medicalDocuments?.[0];
    const payment = a.payments?.[0];
    const parent = a.athleteParents?.[0]?.parent;
    return {
      id: a.id,
      fullName: `${a.firstName} ${a.lastName}`,
      firstName: a.firstName,
      lastName: a.lastName,
      birthDate: a.birthDate,
      sportType: a.sportType,
      level: a.level,
      status: a.status,
      group: a.group ? { id: a.group.id, name: a.group.name } : null,
      coach: a.group?.coach ? { id: a.group.coach.id, name: a.group.coach.user?.fullName } : null,
      medicalStatus: medDoc?.status ?? null,
      paymentStatus: payment?.status ?? null,
      parentPhone: parent?.phone ?? null,
    };
  }
}
