import { Pool } from 'pg';
import { CliArgs } from '../types/cliArgs';
import dotenv from 'dotenv';

dotenv.config();

let poolConfig = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
};

let pool: Pool;

export const setupDatabase = (cliArgs: CliArgs = {}) => {

  poolConfig = {
    ...poolConfig,
    user: cliArgs.dbUser || poolConfig.user,
    host: cliArgs.dbHost || poolConfig.host,
    database: cliArgs.dbName || poolConfig.database,
    password: cliArgs.dbPassword || poolConfig.password,
    port: cliArgs.dbPort || poolConfig.port,
  };

  pool = new Pool(poolConfig);
};

export const getPool = () => {
  if (!pool) {
    throw new Error('Database pool has not been initialized. Call setupDatabase first.');
  }
  return pool;
};
