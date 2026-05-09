import { Injectable } from '@nestjs/common';
import { generateSecret, generateURI, verifySync } from 'otplib';
import { env } from '../config/env';

@Injectable()
export class TotpService {
  generateSecret(): string {
    return generateSecret();
  }

  otpauthUri(secret: string, email: string): string {
    return generateURI({ issuer: env.TOTP_ISSUER, label: email, secret });
  }

  verify(secret: string, code: string): boolean {
    try {
      return verifySync({ token: code, secret, strategy: 'totp' }).valid;
    } catch {
      return false;
    }
  }
}
