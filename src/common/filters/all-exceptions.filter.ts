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

    // Log the error for the developer (us) to see in the console
    if (status === 401) {
      console.warn(`🔐 [Unauthorized] ${request.method} ${request.url}`);
      return response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message: typeof message === 'object' ? (message as any).message : message,
      });
    }

    console.error('------- GLOBAL EXCEPTION -------');
    console.error(`Method: ${request.method} URL: ${request.url}`);
    if (exception instanceof Error) {
      console.error('Stack:', exception.stack);
    } else {
      console.error('Exception:', exception);
    }
    console.error('--------------------------------');

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: typeof message === 'object' ? (message as any).message : message,
    });
  }
}
