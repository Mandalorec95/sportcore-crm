import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ParentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string) {
    const parents = await this.prisma.parent.findMany({
      where: { orgId },
      include: {
        user: true,
        athleteParents: {
          include: {
            athlete: {
              include: {
                group: { select: { name: true } },
                payments: { where: { status: { in: ['debt', 'partial'] } }, take: 1 },
                medicalDocuments: { orderBy: { validUntil: 'asc' }, take: 1 },
              },
            },
          },
        },
      },
    });

    return parents.map((p) => ({
      id: p.id,
      fullName: p.user.fullName,
      email: p.user.email,
      phone: p.phone,
      relation: p.relation,
      children: p.athleteParents.map((ap) => ({
        id: ap.athlete.id,
        fullName: `${ap.athlete.firstName} ${ap.athlete.lastName}`,
        group: ap.athlete.group?.name ?? null,
        hasDebt: ap.athlete.payments.length > 0,
        medicalStatus:
          ap.athlete.medicalDocuments.find((doc) => doc.docType === 'medical_cert' && doc.status !== 'expired')?.status ??
          ap.athlete.medicalDocuments.find((doc) => doc.docType === 'parental_consent' && doc.status === 'approved')?.status ??
          ap.athlete.medicalDocuments[0]?.status ??
          null,
      })),
    }));
  }

  async getMyChildren(parentId: string) {
    const parent = await this.prisma.parent.findUnique({
      where: { id: parentId },
      include: {
        athleteParents: {
          include: {
            athlete: {
              include: {
                group: { include: { schedules: true, coach: { include: { user: true } } } },
                medicalDocuments: { orderBy: { validUntil: 'desc' }, take: 2 },
                payments: { orderBy: { periodMonth: 'desc' }, take: 3 },
                progressRecords: { orderBy: { measuredAt: 'desc' }, take: 5 },
                competitionResults: { include: { competition: true }, orderBy: { createdAt: 'desc' }, take: 3 },
                attendances: { include: { session: true }, orderBy: { createdAt: 'desc' }, take: 10 },
              },
            },
          },
        },
      },
    });

    if (!parent) throw new NotFoundException('Родитель не найден');

    return parent.athleteParents.map((ap) => {
      const a = ap.athlete;
      const attended = a.attendances.filter((x) => x.status === 'present' || x.status === 'late').length;
      const rate = a.attendances.length > 0 ? Math.round((attended / a.attendances.length) * 100) : 0;
      const grades = a.attendances.filter((x) => x.grade != null).map((x) => x.grade as number);
      const avgGrade = grades.length > 0 ? Math.round((grades.reduce((s, g) => s + g, 0) / grades.length) * 10) / 10 : null;
      const admissionDocument =
        a.medicalDocuments.find((doc) => doc.docType === 'medical_cert' && doc.status !== 'expired') ??
        a.medicalDocuments.find((doc) => doc.docType === 'parental_consent' && doc.status === 'approved') ??
        a.medicalDocuments[0];

      return {
        id: a.id,
        fullName: `${a.firstName} ${a.lastName}`,
        sportType: a.sportType,
        level: a.level,
        status: a.status,
        group: a.group
          ? {
              name: a.group.name,
              coach: a.group.coach?.user?.fullName ?? null,
              schedules: a.group.schedules,
            }
          : null,
        attendanceRate: rate,
        avgGrade,
        medicalStatus: admissionDocument?.status ?? null,
        payments: a.payments,
        medicalDocuments: a.medicalDocuments,
        recentProgress: a.progressRecords,
        recentCompetitions: a.competitionResults,
        recentAttendance: a.attendances.map((x) => ({
          date: x.createdAt,
          status: x.status,
          grade: x.grade,
        })),
      };
    });
  }
}
