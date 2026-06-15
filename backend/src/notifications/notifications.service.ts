import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findForUser(userId: string, orgId: string) {
    return this.prisma.notification.findMany({
      where: { recipientId: userId, orgId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async create(orgId: string, recipientId: string, type: string, title: string, message: string) {
    const validTypes = ['payment_debt', 'doc_expiring', 'training', 'competition', 'progress', 'competition_approval'];
    const safeType = validTypes.includes(type) ? type : 'training';
    return this.prisma.notification.create({
      data: { orgId, recipientId, type: safeType as any, title, message },
    });
  }

  async findAll(orgId: string) {
    return this.prisma.notification.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({ where: { recipientId: userId, isRead: false } });
  }

  async update(id: string, data: any) {
    return this.prisma.notification.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.notification.delete({ where: { id } });
  }
}
