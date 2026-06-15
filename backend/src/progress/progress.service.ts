import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProgressDto } from './dto/create-progress.dto';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  async findByAthlete(athleteId: string) {
    const records = await this.prisma.progressRecord.findMany({
      where: { athleteId },
      include: { coach: { include: { user: true } } },
      orderBy: { measuredAt: 'desc' },
    });

    const bySkill: Record<string, any[]> = {};
    for (const r of records) {
      if (!bySkill[r.skillName]) bySkill[r.skillName] = [];
      bySkill[r.skillName].push(r);
    }

    const latest = Object.entries(bySkill).map(([skill, entries]) => ({
      skill,
      current: entries[0].score,
      previous: entries[1]?.score ?? null,
      delta: entries[1] ? entries[0].score - entries[1].score : null,
      lastUpdated: entries[0].measuredAt,
    }));

    const avgScore = latest.length
      ? Math.round(latest.reduce((s, e) => s + e.current, 0) / latest.length)
      : 0;

    return { records, bySkill: latest, avgScore };
  }

  async create(athleteId: string, dto: CreateProgressDto, coachId?: string) {
    return this.prisma.progressRecord.create({
      data: {
        athleteId,
        coachId: coachId ?? null,
        skillName: dto.skillName,
        score: dto.score,
        comment: dto.comment,
        measuredAt: new Date(dto.measuredAt),
      },
      include: { coach: { include: { user: true } } },
    });
  }
}
