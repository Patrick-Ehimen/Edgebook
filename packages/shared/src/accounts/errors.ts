export type AccountErrorCode =
  | 'ACCOUNT_NOT_FOUND'
  | 'KEY_SCOPE_ERROR'
  | 'ACCOUNT_HAS_FILLS'
  | 'FORBIDDEN';

export class AccountError extends Error {
  readonly code: AccountErrorCode;
  constructor(code: AccountErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'AccountError';
    this.code = code;
  }
}

export class AccountNotFoundError extends AccountError {
  constructor(message = 'Account not found.') {
    super('ACCOUNT_NOT_FOUND', message);
    this.name = 'AccountNotFoundError';
  }
}

export class KeyScopeError extends AccountError {
  constructor(
    message = 'This API key has write permissions. Edgebook requires a read-only key.',
  ) {
    super('KEY_SCOPE_ERROR', message);
    this.name = 'KeyScopeError';
  }
}

export class AccountHasFillsError extends AccountError {
  constructor(message = 'Cannot delete an account that has trade data. Remove fills first.') {
    super('ACCOUNT_HAS_FILLS', message);
    this.name = 'AccountHasFillsError';
  }
}

export class AccountForbiddenError extends AccountError {
  constructor(message = 'Access denied.') {
    super('FORBIDDEN', message);
    this.name = 'AccountForbiddenError';
  }
}

export function isAccountError(err: unknown): err is AccountError {
  return err instanceof AccountError;
}
