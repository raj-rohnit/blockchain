import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const body = exception.getResponse();

    const rawMessage = typeof body === 'string' ? body : (body as any).message;
    const errorMessage = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;

    response.status(status).json({ error: errorMessage || exception.message });
  }
}
