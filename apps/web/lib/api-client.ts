import { z } from 'zod';
import { env } from './env';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init.headers },
    credentials: 'include',
    ...init,
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      res.status,
      body?.error ?? body?.message ?? 'UNKNOWN',
      body?.message ?? `HTTP ${res.status}`,
    );
  }

  return schema.parse(body);
}

export const api = {
  get: <T>(path: string, schema: z.ZodType<T>) =>
    request(path, schema),

  post: <T>(path: string, schema: z.ZodType<T>, body: unknown) =>
    request(path, schema, { method: 'POST', body: JSON.stringify(body) }),

  delete: <T>(path: string, schema: z.ZodType<T>) =>
    request(path, schema, { method: 'DELETE' }),
};
