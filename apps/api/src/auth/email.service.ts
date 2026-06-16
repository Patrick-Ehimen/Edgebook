import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { env } from '../config/env';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

  async sendVerification(email: string, code: string): Promise<void> {
    if (!this.resend) {
      this.logger.warn(`[EMAIL] No RESEND_API_KEY — verification code for ${email}: ${code}`);
      return;
    }
    await this.resend.emails.send({
      from: env.EMAIL_FROM,
      to: email,
      subject: 'Your Edgebook verification code',
      html: `<p>Your verification code is: <strong>${code}</strong></p><p>It expires in 15 minutes.</p>`,
    });
  }

  async sendPasswordReset(email: string, code: string): Promise<void> {
    if (!this.resend) {
      this.logger.warn(`[EMAIL] No RESEND_API_KEY — password reset code for ${email}: ${code}`);
      return;
    }
    await this.resend.emails.send({
      from: env.EMAIL_FROM,
      to: email,
      subject: 'Reset your Edgebook password',
      html: `<p>Your password reset code is: <strong>${code}</strong></p><p>It expires in 15 minutes.</p>`,
    });
  }
}
