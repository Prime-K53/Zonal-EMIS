import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : (exception as Error).message || 'Internal server error';

    const normalizedMessage = typeof message === 'object' ? (message as any).message : message;
    const logPayload = {
      level: status === 401 ? 'warn' : 'error',
      status,
      method: request.method,
      path: request.url,
      message: normalizedMessage,
      timestamp: new Date().toISOString(),
      stack: exception instanceof Error ? exception.stack : undefined,
    };

    const responseBody = {
      statusCode: status,
      timestamp: logPayload.timestamp,
      path: request.url,
      message: normalizedMessage,
    };

    if (status === 401) {
      console.warn('[http-error]', JSON.stringify(logPayload));
      return response.status(status).json(responseBody);
    }

    console.error('[http-error]', JSON.stringify(logPayload));
    response.status(status).json(responseBody);
  }
}
