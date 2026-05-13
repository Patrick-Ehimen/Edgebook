import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PasswordService } from './password.service';
import { RecoveryCodesService } from './recovery-codes.service';
import { SessionService } from './session.service';
import { TotpService } from './totp.service';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    TotpService,
    RecoveryCodesService,
    SessionService,
    EmailService,
    JwtAuthGuard,
  ],
  exports: [SessionService, JwtAuthGuard],
})
export class AuthModule {}
