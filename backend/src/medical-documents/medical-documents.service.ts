import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicalDocDto } from './dto/create-medical-doc.dto';

@Injectable()
export class MedicalDocumentsService {
  constructor(private prisma: PrismaService) {}

  async findByAthlete(athleteId: string) {
    return this.prisma.medicalDocument.findMany({
      where: { athleteId },
      orderBy: { validUntil: 'desc' },
    });
  }

  async getExpiring(orgId: string, days = 14) {
    const limit = new Date();
    limit.setDate(limit.getDate() + days);

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

    return docs.map((d) => ({
      ...d,
      daysLeft: Math.ceil((new Date(d.validUntil).getTime() - Date.now()) / 86400000),
    }));
  }

  async create(athleteId: string, dto: CreateMedicalDocDto) {
    const validUntil = new Date(dto.validUntil);
    const now = new Date();
    const daysLeft = Math.ceil((validUntil.getTime() - now.getTime()) / 86400000);
    const status = daysLeft < 0 ? 'expired' : daysLeft <= 14 ? 'expires_soon' : 'valid';

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
    const docs = await this.prisma.medicalDocument.findMany({
      where: { athlete: { orgId } },
      include: { athlete: { select: { id: true, firstName: true, lastName: true, group: { select: { name: true } } } } },
      orderBy: { validUntil: 'asc' },
    });
    return docs.map((d) => ({
      ...d,
      daysLeft: Math.ceil((new Date(d.validUntil).getTime() - Date.now()) / 86400000),
    }));
  }

  async update(id: string, data: any) {
    return this.prisma.medicalDocument.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.medicalDocument.delete({ where: { id } });
  }

  async refreshStatuses(orgId: string) {
    const docs = await this.prisma.medicalDocument.findMany({ where: { athlete: { orgId } } });
    const now = Date.now();
    for (const doc of docs) {
      const daysLeft = Math.ceil((new Date(doc.validUntil).getTime() - now) / 86400000);
      const status = daysLeft < 0 ? 'expired' : daysLeft <= 14 ? 'expires_soon' : 'valid';
      if (status !== doc.status) {
        await this.prisma.medicalDocument.update({ where: { id: doc.id }, data: { status } });
      }
    }
    return { updated: docs.length };
  }
}
