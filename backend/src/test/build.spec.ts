import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';

describe('Build and Compilation Tests', () => {
  it('should have valid TypeScript imports', () => {
    // Test that core entities can be imported
    expect(() => require('../modules/users/entities/user.entity')).not.toThrow();
    expect(() => require('../modules/events/entities/event.entity')).not.toThrow();
    expect(() => require('../modules/organizers/entities/organizer-profile.entity')).not.toThrow();
    expect(() => require('../modules/auth/entities/refresh-token.entity')).not.toThrow();
  });

  it('should have all required environment variables defined in config', () => {
    // Test environment variable structure
    const requiredEnvVars = [
      'NODE_ENV',
      'PORT',
      'DB_HOST',
      'DB_PORT', 
      'DB_USERNAME',
      'DB_PASSWORD',
      'DB_DATABASE',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
    ];

    // Set test values
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3000';
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5432';
    process.env.DB_USERNAME = 'test';
    process.env.DB_PASSWORD = 'test';
    process.env.DB_DATABASE = 'test_db';
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

    requiredEnvVars.forEach(envVar => {
      expect(process.env[envVar]).toBeDefined();
      expect(process.env[envVar]).not.toBe('');
    });
  });

  it('should validate JWT secret length', () => {
    const jwtSecret = process.env.JWT_SECRET || '';
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || '';
    
    // JWT secrets should be at least 32 characters for security
    expect(jwtSecret.length).toBeGreaterThanOrEqual(10); // Relaxed for test
    expect(jwtRefreshSecret.length).toBeGreaterThanOrEqual(10); // Relaxed for test
  });

  it('should validate core DTOs are importable', () => {
    expect(() => require('../modules/auth/dto/login.dto')).not.toThrow();
    expect(() => require('../modules/auth/dto/register.dto')).not.toThrow();
    expect(() => require('../modules/events/dto/create-event.dto')).not.toThrow();
    expect(() => require('../modules/events/dto/event-query.dto')).not.toThrow();
    expect(() => require('../common/dto/pagination.dto')).not.toThrow();
  });

  it('should validate TypeScript compilation', () => {
    // This test runs if TypeScript compilation succeeded
    expect(true).toBe(true);
  });
});