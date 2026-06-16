import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  private includePeople = {
    createdBy: { select: { id: true, fullName: true, role: true } },
    assignedTo: { select: { id: true, fullName: true, role: true } },
  };

  private normalizeStatus(status?: string) {
    if (!status) return undefined;
    return status === 'done' ? 'completed' : status;
  }

  async findAll(orgId: string, user?: any) {
    const where: any = { orgId };
    if (user?.role !== 'admin') {
      where.OR = [{ createdById: user.sub }, { assignedToId: user.sub }];
    }

    return this.prisma.task.findMany({
      where,
      include: this.includePeople,
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async create(dto: CreateTaskDto, orgId: string, userId: string) {
    const assignedToId = dto.assignedToUserId || userId;
    const task = await this.prisma.task.create({
      data: {
        orgId,
        createdById: userId,
        assignedToId,
        title: dto.title,
        description: dto.description,
        status: this.normalizeStatus(dto.status) as any,
        priority: dto.priority,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: this.includePeople,
    });

    await this.notificationsService.create(
      orgId,
      assignedToId,
      'warning',
      'Новая задача',
      `Вам назначена задача: ${task.title}`,
      userId,
      task.id,
      `/notifications/tasks/${task.id}`,
    );

    return task;
  }

  async findOne(id: string, orgId: string, user?: any) {
    const where: any = { id, orgId };
    if (user?.role !== 'admin') {
      where.OR = [{ createdById: user.sub }, { assignedToId: user.sub }];
    }
    const task = await this.prisma.task.findFirst({ where, include: this.includePeople });
    if (!task) throw new NotFoundException('Задача не найдена');
    return task;
  }

  async update(id: string, orgId: string, data: Partial<CreateTaskDto>, user?: any) {
    const task = await this.prisma.task.findFirst({ where: { id, orgId } });
    if (!task) throw new NotFoundException('Задача не найдена');

    const nextStatus = this.normalizeStatus(data.status);
    const nextAssignedToId = data.assignedToUserId;
    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        assignedToId: nextAssignedToId,
        status: nextStatus as any,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: this.includePeople,
    });

    const completionStatuses = ['completed', 'done'];
    if (nextStatus && completionStatuses.includes(nextStatus) && !completionStatuses.includes(task.status)) {
      await this.notificationsService.create(
        orgId,
        updated.assignedToId || task.createdById,
        'success',
        'Задача выполнена',
        `Задача выполнена: ${updated.title}`,
        user?.sub,
        updated.id,
        `/notifications/tasks/${updated.id}`,
      );
    }

    return updated;
  }

  async remove(id: string, orgId: string) {
    const task = await this.prisma.task.findFirst({ where: { id, orgId } });
    if (!task) throw new NotFoundException('Задача не найдена');
    return this.prisma.task.delete({ where: { id } });
  }
}
