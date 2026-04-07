import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module.js';
import type { IncomingMessage, ServerResponse } from 'http';

let cachedApp: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: false });

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');
  await app.init();

  return app.getHttpAdapter().getInstance();
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  if (!cachedApp) {
    cachedApp = await bootstrap();
  }
  cachedApp(req, res);
}
