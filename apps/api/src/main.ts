import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser');
import { AppModule } from './app.module';
import { env } from './config/env';

async function bootstrap() {
  // Disable built-in body parser so we can set a higher limit for base64 image uploads
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.use(json({ limit: '20mb' }));
  app.use(urlencoded({ extended: true, limit: '20mb' }));
  app.use(cookieParser());

  // Temporary request logger for debugging
  app.use((req: import('express').Request, _res: import('express').Response, next: import('express').NextFunction) => {
    if (req.method !== 'OPTIONS') console.log(`[HTTP] ${req.method} ${req.path}`);
    next();
  });

  app.enableCors({
    origin: env.APP_URL,
    credentials: true,
  });

  app.setGlobalPrefix('api');

  await app.listen(env.PORT);
  console.log(`API running on http://localhost:${env.PORT}/api`);
}

bootstrap();
