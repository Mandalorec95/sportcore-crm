import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  private includePeople = {
    sender: { select: { id: true, fullName: true, role: true } },
    recipient: { select: { id: true, fullName: true, role: true } },
    relatedTask: { select: { id: true, title: true, status: true } },
  };

  async findForUser(userId: string, orgId: string) {
    return this.prisma.notification.findMany({
      where: {
        orgId,
        OR: [
          { recipientId: userId },
          { senderId: userId },
        ],
      },
      include: this.includePeople,
      orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
      take: 50,
    });
  }

  async markRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({ where: { id, recipientId: userId } });
    if (!notification) throw new NotFoundException('Уведомление не найдено');
    return this.prisma.notification.update({
      where: { id: notification.id },
      data: { isRead: true },
      include: this.includePeople,
    });
  }

  async getRecipients(user: any) {
    if (user.role === 'parent') return [];

    const baseSelect = { id: true, fullName: true, role: true, email: true };

    if (user.role === 'admin') {
      return this.prisma.user.findMany({
        where: { orgId: user.orgId, role: { in: ['admin', 'coach', 'parent'] } },
        select: baseSelect,
        orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
      });
    }

    return this.prisma.user.findMany({
      where: {
        orgId: user.orgId,
        OR: [
          { id: user.sub },
          { role: 'admin' },
          {
            role: 'parent',
            parent: {
              athleteParents: {
                some: {
                  athlete: {
                    group: {
                      coach: { userId: user.sub },
                    },
                  },
                },
              },
            },
          },
        ],
      },
      select: baseSelect,
      orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
    });
  }

  async create(
    orgId: string,
    recipientId: string,
    type: string,
    title: string,
    message: string,
    senderId?: string,
    relatedTaskId?: string,
    link?: string,
  ) {
    const validTypes = [
      'success',
      'warning',
      'danger',
      'payment_debt',
      'doc_expiring',
      'training',
      'competition',
      'progress',
      'competition_approval',
    ];
    const safeType = validTypes.includes(type) ? type : 'warning';
    return this.prisma.notification.create({
      data: {
        orgId,
        recipientId,
        senderId,
        type: safeType as any,
        title,
        message,
        relatedTaskId,
        link,
      },
      include: this.includePeople,
    });
  }

  async findAll(orgId: string) {
    return this.prisma.notification.findMany({
      where: { orgId },
      include: this.includePeople,
      orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
      take: 100,
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({ where: { recipientId: userId, isRead: false } });
  }

  async update(id: string, data: any) {
    return this.prisma.notification.update({ where: { id }, data, include: this.includePeople });
  }

  async remove(id: string) {
    return this.prisma.notification.delete({ where: { id } });
  }

  async createFromUser(
    user: any,
    body: { recipientId?: string; type?: string; title?: string; message?: string; relatedTaskId?: string; link?: string },
  ) {
    if (user.role === 'parent') {
      throw new ForbiddenException('Родитель может только просматривать уведомления');
    }

    const allowedRecipients = await this.getRecipients(user);

    if (body.recipientId === 'all') {
      if (allowedRecipients.length === 0) {
        throw new ForbiddenException('Нет доступных получателей для отправки');
      }

      const notifications = await Promise.all(
        allowedRecipients.map((recipient) =>
          this.create(
            user.orgId,
            recipient.id,
            body.type || 'warning',
            body.title || 'Уведомление',
            body.message || '',
            user.sub,
            body.relatedTaskId,
            body.link,
          ),
        ),
      );

      return { count: notifications.length, notifications };
    }

    const recipientId = body.recipientId || user.sub;
    const canSendToRecipient = allowedRecipients.some((recipient) => recipient.id === recipientId);
    if (!canSendToRecipient && recipientId !== user.sub) {
      throw new ForbiddenException('Недостаточно прав для отправки этому получателю');
    }

    return this.create(
      user.orgId,
      recipientId,
      body.type || 'warning',
      body.title || 'Уведомление',
      body.message || '',
      user.sub,
      body.relatedTaskId,
      body.link,
    );
  }
}
