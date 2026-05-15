import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-f]{64}$/, 'ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
    .default('0000000000000000000000000000000000000000000000000000000000000000'),
});

export const env = schema.parse(process.env);
