import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompetitionDto, CreateResultDto } from './dto/create-competition.dto';

@Injectable()
export class CompetitionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string) {
    const competitions = await this.prisma.competition.findMany({
      where: { orgId },
      include: {
        _count: { select: { results: true } },
        approvals: { where: { status: 'approved' }, select: { id: true } },
      },
      orderBy: { compDate: 'desc' },
    });

    return competitions.map(({ approvals, ...competition }) => ({
      ...competition,
      participantCount: approvals.length,
    }));
  }

  async findOne(id: string, orgId: string) {
    const comp = await this.prisma.competition.findFirst({
      where: { id, orgId },
      include: {
        results: {
          include: { athlete: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { place: 'asc' },
        },
        approvals: {
          include: { athlete: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!comp) throw new NotFoundException('Соревнование не найдено');
    return comp;
  }

  async create(dto: CreateCompetitionDto, orgId: string) {
    return this.prisma.competition.create({
      data: { ...dto, orgId, compDate: new Date(dto.compDate) },
    });
  }

  async addResult(competitionId: string, dto: CreateResultDto, orgId: string) {
    await this.findOne(competitionId, orgId);
    return this.prisma.competitionResult.create({
      data: { ...dto, competitionId, medal: dto.medal ?? 'none' },
      include: { athlete: { select: { firstName: true, lastName: true } } },
    });
  }

  async getAthleteResults(athleteId: string, orgId: string) {
    return this.prisma.competitionResult.findMany({
      where: { athleteId, athlete: { orgId } },
      include: { competition: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, orgId: string, data: any) {
    const comp = await this.prisma.competition.findFirst({ where: { id, orgId } });
    if (!comp) throw new NotFoundException('Competition not found');
    return this.prisma.competition.update({ where: { id }, data });
  }

  async remove(id: string, orgId: string) {
    const comp = await this.prisma.competition.findFirst({ where: { id, orgId } });
    if (!comp) throw new NotFoundException('Competition not found');
    await this.prisma.competitionResult.deleteMany({ where: { competitionId: id } });
    return this.prisma.competition.delete({ where: { id } });
  }

  async getApprovals(competitionId: string, orgId: string) {
    await this.findOne(competitionId, orgId);
    return this.prisma.competitionApproval.findMany({
      where: { competitionId, orgId },
      include: {
        athlete: { select: { id: true, firstName: true, lastName: true } },
        coach: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async setParticipants(competitionId: string, athleteIds: string[], coachId: string, orgId: string) {
    await this.findOne(competitionId, orgId);

    const uniqueAthleteIds = [...new Set(athleteIds.filter(Boolean))];
    const athletes = await this.prisma.athlete.findMany({
      where: { id: { in: uniqueAthleteIds }, orgId, status: { not: 'archived' } },
      select: { id: true },
    });
    const validAthleteIds = athletes.map((a) => a.id);

    await this.prisma.competitionApproval.deleteMany({
      where: {
        competitionId,
        orgId,
        athleteId: { notIn: validAthleteIds },
      },
    });

    await Promise.all(
      validAthleteIds.map((athleteId) =>
        this.prisma.competitionApproval.upsert({
          where: { competitionId_athleteId: { competitionId, athleteId } },
          update: { status: 'approved', coachId },
          create: { competitionId, athleteId, coachId, orgId, status: 'approved' },
        }),
      ),
    );

    return this.getApprovals(competitionId, orgId);
  }

  async upsertApproval(competitionId: string, athleteId: string, coachId: string, orgId: string, status: string) {
    const comp = await this.findOne(competitionId, orgId);

    const approval = await this.prisma.competitionApproval.upsert({
      where: { competitionId_athleteId: { competitionId, athleteId } },
      update: { status: status as any, coachId },
      create: { competitionId, athleteId, coachId, orgId, status: status as any },
      include: { athlete: { include: { athleteParents: { include: { parent: { include: { user: true } } } } } } },
    });

    if (status === 'pending') {
      const parents = approval.athlete.athleteParents.map((ap) => ap.parent.user);
      await Promise.all(
        parents.map((pu) =>
          this.prisma.notification.create({
            data: {
              orgId,
              recipientId: pu.id,
              type: 'competition_approval',
              title: 'Запрос на участие в соревновании',
              message: `Тренер запрашивает ваше согласие на участие ${approval.athlete.firstName} ${approval.athlete.lastName} в соревновании "${comp.name}". Пожалуйста, подтвердите или отклоните.`,
            },
          }),
        ),
      );
    }

    return approval;
  }

  async parentRespond(competitionId: string, athleteId: string, userId: string, status: 'approved' | 'rejected', comment?: string) {
    const approval = await this.prisma.competitionApproval.findUnique({
      where: { competitionId_athleteId: { competitionId, athleteId } },
      include: { athlete: { include: { athleteParents: { include: { parent: true } } } } },
    });
    if (!approval) throw new NotFoundException('Запрос на участие не найден');

    const parent = await this.prisma.parent.findUnique({ where: { userId } });
    const isRelated = approval.athlete.athleteParents.some((ap) => ap.parentId === parent?.id);
    if (!isRelated) throw new ForbiddenException('Нет доступа');

    return this.prisma.competitionApproval.update({
      where: { id: approval.id },
      data: { status, parentComment: comment },
    });
  }

  async getParentApprovals(userId: string, orgId: string) {
    const parent = await this.prisma.parent.findUnique({
      where: { userId },
      include: { athleteParents: { select: { athleteId: true } } },
    });
    if (!parent) return [];

    const athleteIds = parent.athleteParents.map((ap) => ap.athleteId);
    return this.prisma.competitionApproval.findMany({
      where: { athleteId: { in: athleteIds }, orgId },
      include: {
        athlete: { select: { id: true, firstName: true, lastName: true } },
        competition: { select: { id: true, name: true, compDate: true } },
        coach: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
