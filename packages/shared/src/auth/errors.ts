export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_NOT_VERIFIED'
  | 'TWO_FACTOR_REQUIRED'
  | 'INVALID_CODE'
  | 'RATE_LIMITED'
  | 'WEAK_PASSWORD'
  | 'ACCOUNT_EXISTS';

export class AuthError extends Error {
  readonly code: AuthErrorCode;
  constructor(code: AuthErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'AuthError';
    this.code = code;
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor(message = 'The email or password is incorrect.') {
    super('INVALID_CREDENTIALS', message);
    this.name = 'InvalidCredentialsError';
  }
}

export class EmailNotVerifiedError extends AuthError {
  constructor(message = 'Please verify your email before signing in.') {
    super('EMAIL_NOT_VERIFIED', message);
    this.name = 'EmailNotVerifiedError';
  }
}

export class TwoFactorRequiredError extends AuthError {
  readonly challengeId: string;
  constructor(challengeId: string, message = 'Two-factor verification required.') {
    super('TWO_FACTOR_REQUIRED', message);
    this.name = 'TwoFactorRequiredError';
    this.challengeId = challengeId;
  }
}

export class InvalidCodeError extends AuthError {
  constructor(message = "That code didn't match. Try again.") {
    super('INVALID_CODE', message);
    this.name = 'InvalidCodeError';
  }
}

export class RateLimitedError extends AuthError {
  readonly retryAfterSeconds: number;
  constructor(retryAfterSeconds: number, message = 'Too many attempts. Try again shortly.') {
    super('RATE_LIMITED', message);
    this.name = 'RateLimitedError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class WeakPasswordError extends AuthError {
  constructor(message = 'Password is too weak.') {
    super('WEAK_PASSWORD', message);
    this.name = 'WeakPasswordError';
  }
}

export class AccountExistsError extends AuthError {
  constructor(message = 'An account with that email already exists.') {
    super('ACCOUNT_EXISTS', message);
    this.name = 'AccountExistsError';
  }
}

export function isAuthError(err: unknown): err is AuthError {
  return err instanceof AuthError;
}
