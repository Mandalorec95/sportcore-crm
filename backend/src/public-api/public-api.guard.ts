import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ApiKeysService } from '../api-keys/api-keys.service';

@Injectable()
export class PublicApiGuard implements CanActivate {
  constructor(private apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const rawKey = request.headers['x-api-key'];
    if (!rawKey) throw new UnauthorizedException('X-API-Key header обязателен');

    const { orgId, scopes } = await this.apiKeysService.validateKey(rawKey);
    request.apiContext = { orgId, scopes };
    return true;
  }
}
