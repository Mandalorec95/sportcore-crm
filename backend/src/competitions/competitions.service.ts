import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompetitionDto, CreateResultDto } from './dto/create-competition.dto';

@Injectable()
export class CompetitionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string) {
    return this.prisma.competition.findMany({
      where: { orgId },
      include: { _count: { select: { results: true } } },
      orderBy: { compDate: 'desc' },
    });
  }

  async findOne(id: string, orgId: string) {
    const comp = await this.prisma.competition.findFirst({
      where: { id, orgId },
      include: {
        results: {
          include: { athlete: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { place: 'asc' },
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
}
