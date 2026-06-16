import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string) {
    const users = await this.prisma.user.findMany({
      where: { orgId },
      include: {
        coach: { select: { id: true } },
        parent: { select: { id: true, phone: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone ?? u.parent?.phone ?? null,
      role: u.role,
      demoPassword: u.demoPassword,
      createdAt: u.createdAt,
    }));
  }

  async updateProfile(userId: string, data: { fullName?: string; email?: string; phone?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, fullName: true, email: true, phone: true, role: true },
    });
  }

  async changePassword(userId: string, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
      select: { id: true },
    });
  }

  async generateNewPassword(userId: string, orgId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, orgId } });
    if (!user) throw new NotFoundException('Пользователь не найден');
    const newPassword = Math.random().toString(36).slice(2, 10);
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, demoPassword: newPassword },
    });
    return { password: newPassword };
  }

  async create(
    orgId: string,
    data: { fullName: string; email: string; role: 'admin' | 'coach' | 'parent'; phone?: string },
  ) {
    const rawPassword = Math.random().toString(36).slice(2, 10);
    const passwordHash = await bcrypt.hash(rawPassword, 10);
    const user = await this.prisma.user.create({
      data: {
        orgId,
        fullName: data.fullName,
        email: data.email,
        passwordHash,
        phone: data.phone,
        role: data.role,
        demoPassword: rawPassword,
      },
    });
    if (data.role === 'coach') {
      await this.prisma.coach.create({ data: { userId: user.id, orgId, sportTypes: [] } });
    }
    if (data.role === 'parent') {
      await this.prisma.parent.create({ data: { userId: user.id, orgId, phone: data.phone } });
    }
    return { ...user, demoPassword: rawPassword };
  }

  async update(userId: string, orgId: string, data: { fullName?: string; email?: string; phone?: string; role?: string }) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, orgId } });
    if (!user) throw new NotFoundException('Пользователь не найден');
    const { role, ...rest } = data;
    return this.prisma.user.update({
      where: { id: userId },
      data: { ...rest, ...(role ? { role: role as any } : {}) },
      select: { id: true, fullName: true, email: true, phone: true, role: true },
    });
  }

  async remove(userId: string, orgId: string, currentUserId?: string) {
    if (userId === currentUserId) {
      throw new BadRequestException('Нельзя удалить свою учётную запись');
    }

    const user = await this.prisma.user.findFirst({ where: { id: userId, orgId } });
    if (!user) throw new NotFoundException('Пользователь не найден');

    return this.prisma.$transaction(async (tx) => {
      const coach = await tx.coach.findUnique({ where: { userId } });
      if (coach) {
        await tx.trainingGroup.updateMany({ where: { coachId: coach.id }, data: { coachId: null } });
        await tx.trainingSession.updateMany({ where: { coachId: coach.id }, data: { coachId: null } });
        await tx.progressRecord.updateMany({ where: { coachId: coach.id }, data: { coachId: null } });
        await tx.coach.delete({ where: { id: coach.id } });
      }

      const parent = await tx.parent.findUnique({ where: { userId } });
      if (parent) {
        await tx.athleteParent.deleteMany({ where: { parentId: parent.id } });
        await tx.parent.delete({ where: { id: parent.id } });
      }

      await tx.attendance.updateMany({ where: { createdBy: userId }, data: { createdBy: null } });
      await tx.competitionApproval.deleteMany({ where: { coachId: userId } });
      await tx.notification.updateMany({ where: { senderId: userId }, data: { senderId: null } });
      await tx.notification.deleteMany({ where: { recipientId: userId } });
      await tx.task.updateMany({ where: { assignedToId: userId }, data: { assignedToId: null } });
      await tx.task.deleteMany({ where: { createdById: userId } });

      return tx.user.delete({ where: { id: userId } });
    });
  }
}
