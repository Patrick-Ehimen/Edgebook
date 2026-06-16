import { createHash, randomBytes, randomInt } from 'node:crypto';
import {
  AccountExistsError,
  EmailNotVerifiedError,
  InvalidCodeError,
  InvalidCredentialsError,
} from '@edgebook/shared/auth';
import type {
  EnrollTotpConfirmInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  SignInInput,
  SignUpInput,
  TwoFactorChallengeInput,
  VerifyEmailInput,
} from '@edgebook/shared/auth';
import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import { PasswordService } from './password.service';
import { RecoveryCodesService } from './recovery-codes.service';
import { type RequestMeta, SessionService } from './session.service';
import { TotpService } from './totp.service';

const CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly totpService: TotpService,
    private readonly recoveryCodesService: RecoveryCodesService,
    private readonly sessionService: SessionService,
    private readonly emailService: EmailService,
  ) {
    this.googleClient = new OAuth2Client({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      redirectUri: env.GOOGLE_CALLBACK_URL,
    });
  }

  // ─── Sign up ────────────────────────────────────────────────────────────────

  async signUp(input: SignUpInput, meta: RequestMeta) {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new AccountExistsError();

    const passwordHash = await this.passwordService.hash(input.password);
    const user = await this.prisma.user.create({
      data: { handle: input.handle, email: input.email, passwordHash },
    });

    const code = this.generateNumericCode();
    await this.prisma.emailVerification.create({
      data: {
        email: input.email,
        codeHash: this.hashCode(code),
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      },
    });

    await this.emailService.sendVerification(input.email, code);

    await this.prisma.auditEvent.create({
      data: { userId: user.id, kind: 'SIGNUP', ip: meta.ip, userAgent: meta.userAgent },
    });

    return { email: input.email };
  }

  // ─── Sign in ────────────────────────────────────────────────────────────────

  async signIn(input: SignInInput, res: Response, meta: RequestMeta) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });

    // Always run hash to prevent timing attacks
    const passwordOk = user
      ? await this.passwordService.verify(user.passwordHash, input.password)
      : await this.passwordService.hash('dummy').then(() => false);

    if (!user || !passwordOk) {
      await this.prisma.auditEvent.create({
        data: { kind: 'SIGNIN_FAILED', ip: meta.ip, userAgent: meta.userAgent },
      });
      throw new InvalidCredentialsError();
    }

    if (!user.emailVerifiedAt) throw new EmailNotVerifiedError();

    await this.prisma.auditEvent.create({
      data: { userId: user.id, kind: 'SIGNIN', ip: meta.ip, userAgent: meta.userAgent },
    });

    const totp = await this.prisma.totpSecret.findUnique({ where: { userId: user.id } });
    if (totp) {
      const pending = await this.sessionService.createPending(user.id, meta);
      return { twoFactorRequired: true as const, challengeId: pending.id };
    }

    await this.sessionService.create(user, res, meta);
    return {
      twoFactorRequired: false as const,
      session: this.toSessionShape(user),
    };
  }

  // ─── Sign out ───────────────────────────────────────────────────────────────

  async signOut(sessionId: string, res: Response) {
    await this.sessionService.revoke(sessionId);
    this.sessionService.clearCookie(res);
    return { ok: true as const };
  }

  // ─── Verify email ───────────────────────────────────────────────────────────

  async verifyEmail(input: VerifyEmailInput) {
    const record = await this.prisma.emailVerification.findFirst({
      where: { email: input.email },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || record.expiresAt < new Date()) throw new InvalidCodeError();
    if (record.attempts >= MAX_ATTEMPTS) throw new InvalidCodeError();

    await this.prisma.emailVerification.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });

    if (record.codeHash !== this.hashCode(input.code)) throw new InvalidCodeError();

    const user = await this.prisma.user.update({
      where: { email: input.email },
      data: { emailVerifiedAt: new Date() },
    });

    await this.prisma.emailVerification.delete({ where: { id: record.id } });

    await this.prisma.auditEvent.create({
      data: { userId: user.id, kind: 'EMAIL_VERIFIED' },
    });

    return { ok: true as const };
  }

  // ─── Resend verification ────────────────────────────────────────────────────

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerifiedAt) return { ok: true as const }; // silent

    await this.prisma.emailVerification.deleteMany({ where: { email } });

    const code = this.generateNumericCode();
    await this.prisma.emailVerification.create({
      data: {
        email,
        codeHash: this.hashCode(code),
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      },
    });

    await this.emailService.sendVerification(email, code);
    return { ok: true as const };
  }

  // ─── 2FA enroll ─────────────────────────────────────────────────────────────

  async enrollTotpInit(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const secret = this.totpService.generateSecret();
    const otpauthUri = this.totpService.otpauthUri(secret, user.email);
    const recoveryCodes = this.recoveryCodesService.generate();

    // Store secret and codes provisionally — confirmed in enrollTotpConfirm
    await this.prisma.totpSecret.upsert({
      where: { userId },
      create: { userId, secretEnc: secret, enrolledAt: new Date() },
      update: { secretEnc: secret, enrolledAt: new Date() },
    });
    await this.recoveryCodesService.store(userId, recoveryCodes);

    return { secret, otpauthUri, recoveryCodes };
  }

  async enrollTotpConfirm(userId: string, input: EnrollTotpConfirmInput, meta: RequestMeta) {
    const totp = await this.prisma.totpSecret.findUnique({ where: { userId } });
    if (!totp) throw new InvalidCodeError();

    if (!this.totpService.verify(totp.secretEnc, input.code)) throw new InvalidCodeError();

    await this.prisma.auditEvent.create({
      data: { userId, kind: 'TWO_FACTOR_ENROLLED', ip: meta.ip, userAgent: meta.userAgent },
    });

    return { enrolledAt: totp.enrolledAt.toISOString() };
  }

  // ─── 2FA challenge ──────────────────────────────────────────────────────────

  async twoFactorChallenge(input: TwoFactorChallengeInput, res: Response, meta: RequestMeta) {
    const pending = await this.prisma.session.findUnique({
      where: { id: input.challengeId },
      include: { user: true },
    });

    const isValidPending =
      pending?.jwtId.startsWith('pending:') &&
      pending.revokedAt === null &&
      pending.expiresAt > new Date();

    if (!isValidPending) throw new InvalidCodeError();

    const totp = await this.prisma.totpSecret.findUnique({ where: { userId: pending.userId } });
    if (!totp) throw new InvalidCodeError();

    const isOtp = /^\d{6}$/.test(input.code);
    const valid = isOtp
      ? this.totpService.verify(totp.secretEnc, input.code)
      : await this.recoveryCodesService.verify(pending.userId, input.code);

    if (!valid) throw new InvalidCodeError();

    await this.sessionService.revoke(pending.id);
    await this.sessionService.create(pending.user, res, meta);

    return { session: this.toSessionShape(pending.user) };
  }

  // ─── Google OAuth ──────────────────────────────────────────────────────────

  getGoogleAuthUrl() {
    return this.googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      prompt: 'select_account',
    });
  }

  async handleGoogleCallback(code: string, res: Response, meta: RequestMeta) {
    const { tokens } = await this.googleClient.getToken(code);
    if (!tokens.id_token) {
      throw new Error('No ID token returned from Google');
    }
    const ticket = await this.googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error('Invalid Google token payload');
    }

    const { email, sub: googleId, name } = payload;

    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { oauthAccounts: true },
    });

    if (!user) {
      // Create new user
      const handle = await this.generateUniqueHandle(name || email.split('@')[0]);
      user = await this.prisma.user.create({
        data: {
          email,
          handle,
          emailVerifiedAt: new Date(),
        },
        include: { oauthAccounts: true },
      });

      await this.prisma.auditEvent.create({
        data: { userId: user.id, kind: 'SIGNUP', ip: meta.ip, userAgent: meta.userAgent },
      });
    } else if (!user.emailVerifiedAt) {
      // Auto-verify email if they logged in via Google
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
        include: { oauthAccounts: true },
      });
    }

    // Link Google account if not already linked
    const hasGoogleLink = user.oauthAccounts.some(
      (acc) => acc.provider === 'google' && acc.providerAccountId === googleId,
    );

    if (!hasGoogleLink) {
      await this.prisma.oAuthAccount.upsert({
        where: {
          provider_providerAccountId: {
            provider: 'google',
            providerAccountId: googleId,
          },
        },
        create: {
          userId: user.id,
          provider: 'google',
          providerAccountId: googleId,
        },
        update: {
          userId: user.id,
        },
      });

      await this.prisma.auditEvent.create({
        data: { userId: user.id, kind: 'OAUTH_LINKED', ip: meta.ip, userAgent: meta.userAgent },
      });
    }

    await this.prisma.auditEvent.create({
      data: { userId: user.id, kind: 'SIGNIN', ip: meta.ip, userAgent: meta.userAgent },
    });

    await this.sessionService.create(user, res, meta);
    const appUrl = env.APP_URL.replace(/\/$/, '');
    return res.redirect(`${appUrl}${user.isOnboarded ? '/dashboard' : '/onboarding'}`);
  }

  // ─── Forgot password ────────────────────────────────────────────────────────

  async forgotPassword(input: ForgotPasswordInput) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user) return { ok: true as const }; // never reveal account existence

    await this.prisma.passwordReset.deleteMany({ where: { userId: user.id } });

    const code = this.generateNumericCode();
    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        codeHash: this.hashCode(code),
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      },
    });

    await this.emailService.sendPasswordReset(input.email, code);
    return { ok: true as const };
  }

  // ─── Reset password ─────────────────────────────────────────────────────────

  async resetPassword(input: ResetPasswordInput, meta: RequestMeta) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw new InvalidCodeError();

    const record = await this.prisma.passwordReset.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!record || record.expiresAt < new Date()) throw new InvalidCodeError();
    if (record.attempts >= MAX_ATTEMPTS) throw new InvalidCodeError();

    await this.prisma.passwordReset.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });

    if (record.codeHash !== this.hashCode(input.code)) throw new InvalidCodeError();

    const passwordHash = await this.passwordService.hash(input.newPassword);
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    await this.prisma.passwordReset.delete({ where: { id: record.id } });
    await this.sessionService.revokeAll(user.id);

    await this.prisma.auditEvent.create({
      data: { userId: user.id, kind: 'PASSWORD_CHANGED', ip: meta.ip, userAgent: meta.userAgent },
    });

    return { ok: true as const };
  }

  // ─── Get session ────────────────────────────────────────────────────────────

  async getSession(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.toSessionShape(user);
  }

  // ─── Onboarding ─────────────────────────────────────────────────────────────

  async completeOnboarding(userId: string, res: Response) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isOnboarded: true },
    });

    await this.prisma.auditEvent.create({
      data: { userId, kind: 'ONBOARDING_COMPLETED' },
    });

    res.cookie('eb_onboarded', 'true', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return { ok: true as const };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private toSessionShape(user: {
    id: string;
    handle: string;
    email: string;
    isOnboarded: boolean;
  }) {
    return {
      userId: user.id,
      handle: user.handle,
      email: user.email,
      twoFactorPending: false,
      isOnboarded: user.isOnboarded,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  private generateNumericCode(): string {
    return Array.from({ length: 6 }, () => randomInt(0, 10)).join('');
  }

  private hashCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  private async generateUniqueHandle(base: string): Promise<string> {
    const cleanBase = base
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 15);

    let handle = cleanBase;
    let attempts = 0;

    while (attempts < 5) {
      const existing = await this.prisma.user.findUnique({ where: { handle } });
      if (!existing) return handle;

      handle = `${cleanBase}_${randomBytes(2).toString('hex')}`;
      attempts++;
    }

    return `${cleanBase}_${randomBytes(4).toString('hex')}`;
  }
}
