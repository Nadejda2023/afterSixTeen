import cookieParser from 'cookie-parser';
import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { HttpExceptionFilter } from './exception.filter';

export const accessTokenSecret1 = process.env.ACCESS_TOKEN || '123';
export const refreshTokenSecret2 = process.env.REFRESH_TOKEN || '789';

export const settings = {
  /// в main.ts ничего не экспортируем, во избежании повторного запуска приложения в тестах (Jest автоматически выполняет импортируемый файл)
  MONGO_URI:
    process.env.mongoURI ||
    'mongodb+srv://fsklever:popova12345@cluster0.su82uvr.mongodb.net/blog-dev?retryWrites=true&w=majority',
  JWT_SECRET: process.env.JWT_SECRET || '123',
};
export const appSettings = (app: INestApplication): void => {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      stopAtFirstError: true,
      exceptionFactory: (errors: any[]) => {
        const errorsForResponse: { message: string; field: string }[] = [];

        errors.forEach((e) => {
          const constraintsKeys = Object.keys(e.constraints);
          constraintsKeys.forEach((ckey) => {
            errorsForResponse.push({
              message: e.constraints[ckey],
              field: e.property,
            });
          });
        });
        throw new BadRequestException(errorsForResponse);
      },
    }),
  );

  app.use(cookieParser());
  app.enableCors();
  app.useGlobalFilters(new HttpExceptionFilter());
};
