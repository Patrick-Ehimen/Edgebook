import { AccountError } from '@edgebook/shared/accounts';
import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';

const STATUS_MAP: Record<string, number> = {
  ACCOUNT_NOT_FOUND: 404,
  KEY_SCOPE_ERROR: 422,
  ACCOUNT_HAS_FILLS: 409,
  FORBIDDEN: 403,
};

@Catch(AccountError)
export class AccountExceptionFilter implements ExceptionFilter {
  catch(exception: AccountError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const status = STATUS_MAP[exception.code] ?? 400;
    res.status(status).json({ error: exception.code, message: exception.message });
  }
}
