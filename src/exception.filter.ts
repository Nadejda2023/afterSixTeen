import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';

import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    console.log('RENDER');
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    if (status === 400) {
      const errorResponse: any = {
        errorsMessages: [],
      };
      const responseBody: any = exception.getResponse();
      console.log('responseBody', responseBody);
      if (Array.isArray(responseBody.message)) {
        responseBody.message.forEach((m: any) =>
          errorResponse.errorsMessages.push(m),
        );
        // } else {
        //   errorResponse.errorsMessages.push(responseBody.message);
      }
      console.log('errorResponse', errorResponse);

      response.status(status).json(errorResponse);
    } else {
      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
  }
}
