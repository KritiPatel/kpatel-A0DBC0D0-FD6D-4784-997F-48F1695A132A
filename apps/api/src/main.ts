import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000;

  // Global prefix
  app.setGlobalPrefix('api');

  // Enable CORS for Angular frontend
  app.enableCors({
    origin: ['http://localhost:4200'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      forbidNonWhitelisted: false,
    })
  );

  await app.listen(port);
  Logger.log(`🚀 API running on http://localhost:${port}/api`);
}

bootstrap();
