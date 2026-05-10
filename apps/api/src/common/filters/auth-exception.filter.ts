import { AuthError } from '@edgebook/shared/auth';
import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';

const STATUS_MAP: Record<string, number> = {
  INVALID_CREDENTIALS: 401,
  EMAIL_NOT_VERIFIED: 403,
  INVALID_CODE: 400,
  RATE_LIMITED: 429,
  WEAK_PASSWORD: 400,
  ACCOUNT_EXISTS: 409,
};

@Catch(AuthError)
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: AuthError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const status = STATUS_MAP[exception.code] ?? 400;
    res.status(status).json({ error: exception.code, message: exception.message });
  }
}
