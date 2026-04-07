import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

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
