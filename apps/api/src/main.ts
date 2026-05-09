import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser');
import { AppModule } from './app.module';
import { env } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.enableCors({
    origin: env.APP_URL,
    credentials: true,
  });

  app.setGlobalPrefix('api');

  await app.listen(env.PORT);
  console.log(`API running on http://localhost:${env.PORT}/api`);
}

bootstrap();
