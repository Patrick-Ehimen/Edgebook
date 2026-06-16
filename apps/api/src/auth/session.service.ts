import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { verify as jwtVerify, sign } from 'jsonwebtoken';
import { env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
interface User {
  id: string;
  handle: string;
  email: string;
  isOnboarded: boolean;
}

const COOKIE = 'eb_session';
const ONBOARDED_COOKIE = 'eb_onboarded';
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const PENDING_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface JwtPayload {
  sub: string;
  jti: string;
}

export interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: User, res: Response, meta: RequestMeta) {
    const jwtId = randomUUID();
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        jwtId,
        ip: meta.ip,
        userAgent: meta.userAgent,
        expiresAt: new Date(Date.now() + TTL_MS),
      },
    });

    const token = sign({ sub: user.id, jti: jwtId } satisfies JwtPayload, env.JWT_SECRET, {
      expiresIn: '7d',
    });

    const crossOrigin = env.NODE_ENV === 'production';
    res.cookie(COOKIE, token, {
      httpOnly: true,
      secure: crossOrigin,
      sameSite: crossOrigin ? 'none' : 'lax',
      maxAge: TTL_MS,
      path: '/',
    });

    res.cookie(ONBOARDED_COOKIE, String(user.isOnboarded), {
      httpOnly: true,
      secure: crossOrigin,
      sameSite: crossOrigin ? 'none' : 'lax',
      maxAge: TTL_MS,
      path: '/',
    });

    return session;
  }

  // Creates a short-lived placeholder session for the 2FA challenge window.
  // The session.id is returned to the client as challengeId.
  // jwtId prefix 'pending:' distinguishes it from real sessions.
  async createPending(userId: string, meta: RequestMeta) {
    return this.prisma.session.create({
      data: {
        userId,
        jwtId: `pending:${randomUUID()}`,
        ip: meta.ip,
        userAgent: meta.userAgent,
        expiresAt: new Date(Date.now() + PENDING_TTL_MS),
      },
    });
  }

  async fromRequest(req: Request): Promise<{ userId: string; sessionId: string } | null> {
    const token: unknown = req.cookies?.[COOKIE];
    if (typeof token !== 'string') return null;

    try {
      const payload = jwtVerify(token, env.JWT_SECRET) as JwtPayload;
      if (payload.jti.startsWith('pending:')) return null;

      const session = await this.prisma.session.findFirst({
        where: { jwtId: payload.jti, revokedAt: null, expiresAt: { gt: new Date() } },
      });
      if (!session) return null;

      return { userId: payload.sub, sessionId: session.id };
    } catch {
      return null;
    }
  }

  async revoke(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAll(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  clearCookie(res: Response): void {
    const crossOrigin = env.NODE_ENV === 'production';
    const opts = { path: '/', secure: crossOrigin, sameSite: crossOrigin ? ('none' as const) : ('lax' as const) };
    res.clearCookie(COOKIE, opts);
    res.clearCookie(ONBOARDED_COOKIE, opts);
  }
}
