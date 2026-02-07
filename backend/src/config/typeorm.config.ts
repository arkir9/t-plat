import { DataSource } from 'typeorm';
import { getDatabaseConfig, getDataSourceOptions } from './database.config';

// For NestJS
export const typeOrmConfig = getDatabaseConfig;

// For TypeORM CLI migrations
export default new DataSource(getDataSourceOptions());
