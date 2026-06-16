import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicalDocDto } from './dto/create-medical-doc.dto';

@Injectable()
export class MedicalDocumentsService {
  constructor(private prisma: PrismaService) {}

  private includeDocumentDetails = {
    athlete: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        group: { select: { name: true, coach: { select: { userId: true } } } },
        athleteParents: {
          include: {
            parent: { include: { user: { select: { id: true, fullName: true } } } },
          },
        },
      },
    },
  };

  private calcMedicalStatus(validUntil: Date) {
    const now = new Date();
    const daysLeft = Math.ceil((validUntil.getTime() - now.getTime()) / 86400000);
    return daysLeft < 0 ? 'expired' : daysLeft <= 14 ? 'expires_soon' : 'valid';
  }

  private oneYearFromNow() {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date;
  }

  async findByAthlete(athleteId: string) {
    return this.prisma.medicalDocument.findMany({
      where: { athleteId },
      include: this.includeDocumentDetails,
      orderBy: { validUntil: 'desc' },
    });
  }

  async getExpiring(orgId: string, days = 14) {
    const limit = new Date();
    limit.setDate(limit.getDate() + days);
    const now = new Date();

    const docs = await this.prisma.medicalDocument.findMany({
      where: {
        athlete: { orgId },
        validUntil: { lte: limit },
        status: { not: 'expired' },
      },
      include: {
        athlete: { select: { id: true, firstName: true, lastName: true, group: { select: { name: true } } } },
      },
      orderBy: { validUntil: 'asc' },
    });

    return docs.map((d) => {
      const validUntilTime = new Date(d.validUntil).getTime();
      const daysLeft = Math.max(0, Math.ceil((validUntilTime - now.getTime()) / 86400000));
      return {
        ...d,
        daysLeft,
      };
    });
  }

  async create(athleteId: string, dto: CreateMedicalDocDto) {
    const validUntil = new Date(dto.validUntil);
    const status = this.calcMedicalStatus(validUntil);

    return this.prisma.medicalDocument.create({
      data: {
        athleteId,
        docType: dto.docType as any,
        issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : null,
        validUntil,
        fileUrl: dto.fileUrl,
        status,
      },
    });
  }

  async findAll(orgId: string) {
    const now = new Date();
    const docs = await this.prisma.medicalDocument.findMany({
      where: { athlete: { orgId } },
      include: this.includeDocumentDetails,
      orderBy: { validUntil: 'asc' },
    });
    return docs.map((d) => {
      const validUntilTime = new Date(d.validUntil).getTime();
      const daysLeft = Math.max(0, Math.ceil((validUntilTime - now.getTime()) / 86400000));
      return {
        ...d,
        daysLeft,
      };
    });
  }

  async update(id: string, data: any) {
    const existing = await this.prisma.medicalDocument.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Документ не найден');

    const docType = data.docType ?? existing.docType;
    const validUntil = data.validUntil ? new Date(data.validUntil) : existing.validUntil;
    const updateData: any = {
      ...(data.docType ? { docType: data.docType } : {}),
      ...(data.issuedAt !== undefined ? { issuedAt: data.issuedAt ? new Date(data.issuedAt) : null } : {}),
      ...(data.validUntil ? { validUntil } : {}),
      ...(data.fileUrl !== undefined ? { fileUrl: data.fileUrl || null } : {}),
    };

    if (docType === 'medical_cert') {
      updateData.status = this.calcMedicalStatus(validUntil) as any;
    }

    return this.prisma.medicalDocument.update({
      where: { id },
      data: updateData,
      include: this.includeDocumentDetails,
    });
  }

  async remove(id: string) {
    return this.prisma.medicalDocument.delete({ where: { id } });
  }

  async refreshStatuses(orgId: string) {
    const docs = await this.prisma.medicalDocument.findMany({ where: { athlete: { orgId }, docType: 'medical_cert' } });
    for (const doc of docs) {
      const status = this.calcMedicalStatus(doc.validUntil);
      if (status !== doc.status) {
        await this.prisma.medicalDocument.update({ where: { id: doc.id }, data: { status } });
      }
    }
    return { updated: docs.length };
  }

  async requestParentConsent(athleteId: string, orgId: string, user: any) {
    if (!['admin', 'coach'].includes(user.role)) {
      throw new ForbiddenException('Недостаточно прав для отправки запроса');
    }

    const athlete = await this.prisma.athlete.findFirst({
      where: { id: athleteId, orgId },
      include: {
        group: { include: { coach: true } },
        athleteParents: { include: { parent: { include: { user: true } } } },
      },
    });
    if (!athlete) throw new NotFoundException('Спортсмен не найден');
    if (user.role === 'coach' && athlete.group?.coach?.userId !== user.sub) {
      throw new ForbiddenException('Недостаточно прав для этого спортсмена');
    }
    if (athlete.athleteParents.length === 0) {
      throw new BadRequestException('У спортсмена не указан родитель');
    }

    const existing = await this.prisma.medicalDocument.findFirst({
      where: { athleteId, docType: 'parental_consent' },
      orderBy: { createdAt: 'desc' },
    });

    const doc = existing
      ? await this.prisma.medicalDocument.update({
          where: { id: existing.id },
          data: {
            status: 'pending',
            validUntil: this.oneYearFromNow(),
            requestedByUserId: user.sub,
            requestedAt: new Date(),
            approvedByParentId: null,
            approvedAt: null,
            rejectedAt: null,
          },
          include: this.includeDocumentDetails,
        })
      : await this.prisma.medicalDocument.create({
          data: {
            athleteId,
            docType: 'parental_consent',
            validUntil: this.oneYearFromNow(),
            status: 'pending',
            requestedByUserId: user.sub,
            requestedAt: new Date(),
          },
          include: this.includeDocumentDetails,
        });

    await Promise.all(
      athlete.athleteParents.map((ap) =>
        this.prisma.notification.create({
          data: {
            orgId,
            recipientId: ap.parent.userId,
            senderId: user.sub,
            type: 'warning',
            title: 'Требуется согласие родителя',
            message: `Подтвердите согласие на допуск ребёнка ${athlete.firstName} ${athlete.lastName} к занятиям.`,
            link: '/parent',
          },
        }),
      ),
    );

    return doc;
  }

  async getParentConsentRequests(user: any) {
    const parent = await this.prisma.parent.findUnique({
      where: { userId: user.sub },
      include: { athleteParents: true },
    });
    if (!parent) return [];

    const athleteIds = parent.athleteParents.map((ap) => ap.athleteId);
    return this.prisma.medicalDocument.findMany({
      where: { athleteId: { in: athleteIds }, docType: 'parental_consent' },
      include: this.includeDocumentDetails,
      orderBy: { requestedAt: 'desc' },
    });
  }

  async respondParentConsent(id: string, user: any, status: 'approved' | 'rejected') {
    const parent = await this.prisma.parent.findUnique({
      where: { userId: user.sub },
      include: { athleteParents: true },
    });
    if (!parent) throw new NotFoundException('Родитель не найден');

    const doc = await this.prisma.medicalDocument.findUnique({
      where: { id },
      include: this.includeDocumentDetails,
    });
    if (!doc || doc.docType !== 'parental_consent') throw new NotFoundException('Запрос согласия не найден');

    const isRelated = parent.athleteParents.some((ap) => ap.athleteId === doc.athleteId);
    if (!isRelated) throw new ForbiddenException('Нет доступа к этому запросу');

    const updated = await this.prisma.medicalDocument.update({
      where: { id },
      data: {
        status,
        approvedByParentId: status === 'approved' ? parent.id : null,
        approvedAt: status === 'approved' ? new Date() : null,
        rejectedAt: status === 'rejected' ? new Date() : null,
      },
      include: this.includeDocumentDetails,
    });

    if (doc.requestedByUserId) {
      const athleteName = `${doc.athlete.firstName} ${doc.athlete.lastName}`;
      await this.prisma.notification.create({
        data: {
          orgId: user.orgId,
          recipientId: doc.requestedByUserId,
          senderId: user.sub,
          type: status === 'approved' ? 'success' : 'danger',
          title: status === 'approved' ? 'Согласие подтверждено' : 'Согласие отклонено',
          message:
            status === 'approved'
              ? `Родитель подтвердил согласие на занятия для ребёнка ${athleteName}.`
              : `Родитель отклонил согласие на занятия для ребёнка ${athleteName}.`,
          link: '/documents',
        },
      });
    }

    return updated;
  }
}
