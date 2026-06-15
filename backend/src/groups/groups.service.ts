import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string) {
    const groups = await this.prisma.trainingGroup.findMany({
      where: { orgId },
      include: {
        coach: { include: { user: true } },
        schedules: true,
        _count: { select: { athletes: true } },
      },
      orderBy: { name: 'asc' },
    });
    return groups.map((g) => ({
      ...g,
      athletesCount: g._count.athletes,
      coachName: g.coach?.user?.fullName ?? null,
    }));
  }

  async findOne(id: string, orgId: string) {
    const group = await this.prisma.trainingGroup.findFirst({
      where: { id, orgId },
      include: {
        coach: { include: { user: true } },
        schedules: true,
        athletes: {
          where: { status: { not: 'archived' } },
          include: {
            medicalDocuments: { orderBy: { validUntil: 'desc' }, take: 1 },
            payments: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
    });
    if (!group) throw new NotFoundException('Группа не найдена');
    return group;
  }

  async create(dto: CreateGroupDto, orgId: string) {
    return this.prisma.trainingGroup.create({
      data: { ...dto, orgId },
      include: { coach: { include: { user: true } }, schedules: true },
    });
  }

  async update(id: string, dto: UpdateGroupDto, orgId: string) {
    await this.findOne(id, orgId);
    return this.prisma.trainingGroup.update({
      where: { id },
      data: dto,
      include: { coach: { include: { user: true } }, schedules: true },
    });
  }

  async addMember(groupId: string, athleteId: string, orgId: string) {
    await this.findOne(groupId, orgId);
    return this.prisma.athlete.update({
      where: { id: athleteId },
      data: { groupId },
    });
  }

  async removeMember(groupId: string, athleteId: string, orgId: string) {
    await this.findOne(groupId, orgId);
    return this.prisma.athlete.update({
      where: { id: athleteId },
      data: { groupId: null },
    });
  }
}
