import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as express from 'express';
import { useContainer } from 'class-validator';
import { appSettings } from './setting';
import { ConfigService } from '@nestjs/config';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  //добавила глобально здесь пайп{ transform: true }
  appSettings(app);
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  //app.useGlobalGuards();
  const port = configService.get('port');
  await app.listen(port);
}
bootstrap();
