import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  TOTP_ISSUER: z.string().default('Edgebook'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),
  // 32-byte hex key for AES-256-GCM envelope encryption of API key secrets.
  // Generate with: openssl rand -hex 32
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-f]{64}$/, 'ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
    .default('0000000000000000000000000000000000000000000000000000000000000000'),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().default('noreply@edgebook.app'),
});

export const env = schema.parse(process.env);
