import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string) {
    return this.prisma.task.findMany({
      where: { orgId },
      include: { createdBy: { select: { id: true, fullName: true } } },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async create(dto: CreateTaskDto, orgId: string, userId: string) {
    return this.prisma.task.create({
      data: {
        ...dto,
        orgId,
        createdById: userId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: { createdBy: { select: { id: true, fullName: true } } },
    });
  }

  async update(id: string, orgId: string, data: Partial<CreateTaskDto>) {
    const task = await this.prisma.task.findFirst({ where: { id, orgId } });
    if (!task) throw new NotFoundException('Задача не найдена');
    return this.prisma.task.update({
      where: { id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      },
      include: { createdBy: { select: { id: true, fullName: true } } },
    });
  }

  async remove(id: string, orgId: string) {
    const task = await this.prisma.task.findFirst({ where: { id, orgId } });
    if (!task) throw new NotFoundException('Задача не найдена');
    return this.prisma.task.delete({ where: { id } });
  }
}
