import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggerService } from './logger/logger.service';

async function bootstrap() {
  const loggerService = new LoggerService();

  const app = await NestFactory.create(AppModule);

  loggerService.log('🚀 Initializing SportPass CRM API...');

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  loggerService.log(`✅ CORS enabled for origins: ${allowedOrigins.join(', ')}`);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );
  loggerService.log('✅ Validation pipe configured');

  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('SportPass CRM API')
    .setDescription(
      [
        'CRM для детских спортивных секций. Цифровой паспорт спортсмена.',
        '',
        'Внутренние endpoints используют JWT Bearer token из `POST /api/v1/auth/login`.',
        'Публичные интеграционные endpoints `/api/v1/public/v1/*` используют заголовок `X-API-Key`.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token from POST /api/v1/auth/login.',
      },
      'bearer',
    )
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'Public integration API key generated in the admin panel.',
      },
      'api-key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  loggerService.log('✅ Swagger documentation available at /docs');

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  loggerService.log(`✅ SportPass CRM running on http://localhost:${port}`);
  loggerService.log(`📚 Swagger docs: http://localhost:${port}/docs`);
  loggerService.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap().catch((error) => {
  const loggerService = new LoggerService();
  loggerService.error('Failed to start application', error);
  process.exit(1);
});
