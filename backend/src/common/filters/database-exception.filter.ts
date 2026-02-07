import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DatabaseExceptionFilter.name);

  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const message = exception.message;
    const code = (exception as any).code;

    // Handle specific database errors
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorMessage = 'Database error occurred';

    // PostgreSQL unique violation
    if (code === '23505') {
      status = HttpStatus.CONFLICT;
      errorMessage = 'Resource already exists';
    }
    // PostgreSQL foreign key violation
    else if (code === '23503') {
      status = HttpStatus.BAD_REQUEST;
      errorMessage = 'Invalid reference to related resource';
    }
    // PostgreSQL not null violation
    else if (code === '23502') {
      status = HttpStatus.BAD_REQUEST;
      errorMessage = 'Required field is missing';
    }

    this.logger.error(
      `Database Error [${code}]: ${message}`,
      exception.stack,
      `${request.method} ${request.url}`,
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: errorMessage,
      error: 'Database Error',
    });
  }
}
