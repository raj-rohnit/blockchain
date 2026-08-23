import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaService } from './database/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const prisma = app.get(PrismaService);
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('Connected to Postgres.');
  } catch (err) {
    console.error('Could not connect to Postgres. Is the Docker container running? (docker compose up -d)');
    console.error((err as Error).message);
    process.exit(1);
  }

  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);
  console.log(`Credential chain backend listening on http://localhost:${port}`);
}

bootstrap();
