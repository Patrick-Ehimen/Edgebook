import 'reflect-metadata';
import { config } from 'dotenv';
config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  app.enableShutdownHooks();

  process.on('SIGTERM', () => app.close());
  process.on('SIGINT', () => app.close());
}

bootstrap();
