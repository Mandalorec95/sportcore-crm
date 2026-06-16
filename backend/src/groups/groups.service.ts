import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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

  async addMember(groupId: string, athleteIds: string[], orgId: string, user?: any) {
    const group = await this.findOne(groupId, orgId);
    this.ensureCanManageGroup(group, user);

    const uniqueAthleteIds = Array.from(new Set(athleteIds.filter(Boolean)));
    if (uniqueAthleteIds.length === 0) {
      throw new BadRequestException('Выберите хотя бы одного спортсмена');
    }

    const athletes = await this.prisma.athlete.findMany({
      where: { id: { in: uniqueAthleteIds }, orgId, status: { not: 'archived' } },
    });
    if (athletes.length !== uniqueAthleteIds.length) {
      throw new NotFoundException('Один или несколько спортсменов не найдены');
    }

    const athletesToAdd = athletes.filter((athlete) => athlete.groupId !== groupId);
    if (athletesToAdd.length === 0) {
      throw new BadRequestException('Выбранные спортсмены уже находятся в этой группе');
    }

    const count = await this.prisma.athlete.count({
      where: { groupId, status: { not: 'archived' } },
    });
    if (count + athletesToAdd.length > group.capacity) {
      throw new Error(`Группа переполнена. Максимум ${group.capacity} спортсменов`);
    }

    await this.prisma.athlete.updateMany({
      where: { id: { in: athletesToAdd.map((athlete) => athlete.id) }, orgId },
      data: { groupId },
    });

    return this.findOne(groupId, orgId);
  }

  async removeMember(groupId: string, athleteId: string, orgId: string, user?: any) {
    const group = await this.findOne(groupId, orgId);
    this.ensureCanManageGroup(group, user);
    const athlete = await this.prisma.athlete.findFirst({
      where: { id: athleteId, orgId },
    });
    if (!athlete) throw new NotFoundException('Спортсмен не найден');
    if (athlete.groupId !== groupId) {
      return { success: true };
    }
    return this.prisma.athlete.update({
      where: { id: athleteId },
      data: { groupId: null },
    });
  }

  async remove(id: string, orgId: string) {
    await this.findOne(id, orgId);
    await this.prisma.athlete.updateMany({ where: { groupId: id }, data: { groupId: null } });
    return this.prisma.trainingGroup.delete({ where: { id } });
  }

  private ensureCanManageGroup(group: any, user?: any) {
    const canManage =
      user?.role === 'admin' ||
      (user?.role === 'coach' && group?.coach?.userId === user?.sub);

    if (!canManage) {
      throw new ForbiddenException('Недостаточно прав для управления группой');
    }
  }
}
