import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string) {
    const keys = await this.prisma.apiKey.findMany({
      where: { orgId, isActive: true },
      select: { id: true, name: true, keyPrefix: true, scopes: true, createdAt: true, lastUsedAt: true },
    });
    return keys;
  }

  async create(orgId: string, name: string, scopes: string[]) {
    const rawKey = `sk_live_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = await bcrypt.hash(rawKey, 10);
    const keyPrefix = rawKey.slice(0, 14);

    const apiKey = await this.prisma.apiKey.create({
      data: { orgId, name, keyHash, keyPrefix, scopes },
    });

    return { id: apiKey.id, name: apiKey.name, key: rawKey, scopes: apiKey.scopes };
  }

  async revoke(id: string, orgId: string) {
    const key = await this.prisma.apiKey.findFirst({ where: { id, orgId } });
    if (!key) throw new NotFoundException('Ключ не найден');
    await this.prisma.apiKey.update({ where: { id }, data: { isActive: false } });
    return { success: true };
  }

  async validateKey(rawKey: string, requiredScope?: string): Promise<{ orgId: string; scopes: string[] }> {
    const keyPrefix = rawKey.slice(0, 14);
    const key = await this.prisma.apiKey.findFirst({
      where: { keyPrefix, isActive: true }
    });

    if (!key) {
      throw new UnauthorizedException('Недействительный API-ключ');
    }

    const valid = await bcrypt.compare(rawKey, key.keyHash);
    if (!valid) {
      throw new UnauthorizedException('Недействительный API-ключ');
    }

    if (requiredScope && !key.scopes.includes(requiredScope)) {
      throw new UnauthorizedException('Недостаточно прав API-ключа');
    }

    await this.prisma.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } });
    return { orgId: key.orgId, scopes: key.scopes };
  }
}
