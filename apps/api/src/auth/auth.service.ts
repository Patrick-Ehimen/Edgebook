import { Injectable } from '@nestjs/common';
import { createHash, randomInt } from 'crypto';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from './password.service';
import { TotpService } from './totp.service';
import { RecoveryCodesService } from './recovery-codes.service';
import { SessionService, type RequestMeta } from './session.service';
import { EmailService } from './email.service';
import {
  AccountExistsError,
  InvalidCodeError,
  InvalidCredentialsError,
  EmailNotVerifiedError,
} from '@edgebook/shared/auth';
import type {
  SignUpInput,
  SignInInput,
  VerifyEmailInput,
  EnrollTotpConfirmInput,
  TwoFactorChallengeInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '@edgebook/shared/auth';

const CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly totpService: TotpService,
    private readonly recoveryCodesService: RecoveryCodesService,
    private readonly sessionService: SessionService,
    private readonly emailService: EmailService,
  ) {}

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

    this.emailService.sendVerification(input.email, code);

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

    this.emailService.sendVerification(email, code);
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
      pending &&
      pending.jwtId.startsWith('pending:') &&
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

    this.emailService.sendPasswordReset(input.email, code);
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

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private toSessionShape(user: { id: string; handle: string; email: string }) {
    return {
      userId: user.id,
      handle: user.handle,
      email: user.email,
      twoFactorPending: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  private generateNumericCode(): string {
    return Array.from({ length: 6 }, () => randomInt(0, 10)).join('');
  }

  private hashCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }
}
