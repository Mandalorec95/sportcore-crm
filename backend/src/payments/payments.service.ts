import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string, query: any = {}) {
    const where: any = { orgId };
    if (query.status) where.status = query.status;
    if (query.athleteId) where.athleteId = query.athleteId;
    if (query.periodMonth) where.periodMonth = query.periodMonth;

    return this.prisma.payment.findMany({
      where,
      include: {
        athlete: { select: { id: true, firstName: true, lastName: true, group: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDebtors(orgId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { orgId, status: { in: ['debt', 'partial'] } },
      include: {
        athlete: {
          include: {
            athleteParents: { include: { parent: true }, where: { isPrimary: true }, take: 1 },
            group: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const debtPayments = payments.filter((p) => p.amount - p.paidAmount > 0);
    const totalDebt = debtPayments.reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);

    return {
      totalDebt,
      count: debtPayments.length,
      debtors: debtPayments.map((p) => ({
        paymentId: p.id,
        athleteId: p.athleteId,
        fullName: `${p.athlete.firstName} ${p.athlete.lastName}`,
        group: p.athlete.group?.name ?? null,
        debtAmount: p.amount - p.paidAmount,
        periodMonth: p.periodMonth,
        parentPhone: p.athlete.athleteParents[0]?.parent?.phone ?? null,
        dueDate: p.dueDate,
        overdueDays: p.dueDate
          ? Math.max(0, Math.floor((Date.now() - new Date(p.dueDate).getTime()) / 86400000))
          : null,
      })),
    };
  }

  async getAthleteBalance(athleteId: string, orgId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { athleteId, orgId },
      orderBy: { periodMonth: 'desc' },
    });
    const totalDebt = payments
      .filter((p) => p.status === 'debt' || p.status === 'partial')
      .reduce((s, p) => s + (p.amount - p.paidAmount), 0);
    return { athleteId, payments, totalDebt };
  }

  async create(dto: CreatePaymentDto, orgId: string) {
    const paidAmount = dto.paidAmount ?? 0;
    const status =
      paidAmount === 0 ? 'debt' :
      paidAmount >= dto.amount ? 'paid' : 'partial';

    return this.prisma.payment.create({
      data: {
        ...dto,
        orgId,
        paidAmount,
        status,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        paymentDate: paidAmount > 0 ? new Date() : undefined,
      },
    });
  }

  async confirm(id: string, orgId: string, paidAmount?: number) {
    const payment = await this.prisma.payment.findFirst({ where: { id, orgId } });
    if (!payment) throw new NotFoundException('Платёж не найден');

    const paymentAmount = paidAmount ?? (payment.amount - payment.paidAmount);
    if (paymentAmount <= 0) {
      throw new BadRequestException('Введите корректную сумму оплаты');
    }

    const newPaid = Math.min(payment.amount, payment.paidAmount + paymentAmount);
    const status = newPaid >= payment.amount ? 'paid' : 'partial';

    return this.prisma.payment.update({
      where: { id },
      data: { paidAmount: newPaid, status, paymentDate: new Date() },
    });
  }

  async update(id: string, orgId: string, data: any) {
    const payment = await this.prisma.payment.findFirst({ where: { id, orgId } });
    if (!payment) throw new NotFoundException('Payment not found');
    return this.prisma.payment.update({ where: { id }, data });
  }

  async remove(id: string, orgId: string) {
    const payment = await this.prisma.payment.findFirst({ where: { id, orgId } });
    if (!payment) throw new NotFoundException('Payment not found');
    return this.prisma.payment.delete({ where: { id } });
  }
}
