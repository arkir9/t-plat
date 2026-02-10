import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const maxAttempts = 3;
    const delayMs = 500;
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.dataSource.query('SELECT 1');
        return this.getStatus(key, true);
      } catch (error) {
        lastError = error as Error;
        if (
          attempt < maxAttempts &&
          (lastError.message?.includes('EAI_AGAIN') || lastError.message?.includes('ECONNREFUSED'))
        ) {
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }
        throw new HealthCheckError(
          'Database check failed',
          this.getStatus(key, false, { message: lastError.message }),
        );
      }
    }
    throw new HealthCheckError(
      'Database check failed',
      this.getStatus(key, false, { message: lastError?.message ?? 'unknown' }),
    );
  }
}
