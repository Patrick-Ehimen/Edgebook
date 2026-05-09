import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  TOTP_ISSUER: z.string().default('Edgebook'),
});

export const env = schema.parse(process.env);
