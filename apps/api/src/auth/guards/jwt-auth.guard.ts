import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { SessionService } from '../session.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { userId?: string; sessionId?: string }>();
    const result = await this.sessionService.fromRequest(req);
    if (!result) throw new UnauthorizedException();
    req.userId = result.userId;
    req.sessionId = result.sessionId;
    return true;
  }
}
