import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const isProduction = process.env.NODE_ENV === 'production';
  const corsOrigin = isProduction
    ? (process.env.FRONTEND_URL || '').split(',').map((url) => url.trim())
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
      ];

  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 3600,
  });

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Pastor Activity Tracking API')
    .setDescription(
      'API REST para el sistema de seguimiento de actividades pastorales. ' +
        'Gestiona asociaciones, distritos, usuarios, categorias de actividades, reportes diarios y consolidados.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticacion y gestion de usuarios')
    .addTag('associations', 'Gestion de asociaciones')
    .addTag('districts', 'Gestion de distritos')
    .addTag('activity-categories', 'Categorias de actividades pastorales')
    .addTag('daily-reports', 'Reportes diarios de actividades')
    .addTag('consolidated', 'Reportes consolidados y estadisticas')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });

  app.enableShutdownHooks();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(
    `Backend Pastor Activity Tracking corriendo en: http://localhost:${port}/api`,
  );
  console.log(
    `Documentacion Swagger disponible: http://localhost:${port}/api/docs`,
  );
}
void bootstrap();
