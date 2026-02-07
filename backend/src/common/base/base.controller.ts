import { UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

export function ApiController(prefix: string) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      constructor(...args: any[]) {
        super(...args);
      }
    };
  };
}

export const ProtectedController = () => {
  return (target: any) => {
    UseGuards(JwtAuthGuard)(target);
  };
};
