import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let errorBody: any;

    if (typeof exceptionResponse === 'string') {
      errorBody = {
        code: 'ERROR',
        message: exceptionResponse,
      };
    } else if (typeof exceptionResponse === 'object') {
      const resp = exceptionResponse as any;
      errorBody = {
        code: resp.error || 'ERROR',
        message: resp.message || 'An error occurred',
        field_errors: resp.field_errors || undefined,
      };
      if (Array.isArray(resp.message)) {
        errorBody.message = 'Validation failed';
        errorBody.field_errors = resp.message;
      }
    }

    this.logger.error(
      `${request.method} ${request.url} ${status}: ${JSON.stringify(errorBody)}`,
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...errorBody,
    });
  }
}
