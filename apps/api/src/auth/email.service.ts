import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  sendVerification(email: string, code: string): void {
    this.logger.log(`[EMAIL] Verification code for ${email}: ${code}`);
  }

  sendPasswordReset(email: string, code: string): void {
    this.logger.log(`[EMAIL] Password reset code for ${email}: ${code}`);
  }
}
