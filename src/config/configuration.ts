import { registerAs } from '@nestjs/config';
import {
  IsString,
  IsNumber,
  IsUrl,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export class DatabaseConfig {
  @IsString()
  DATABASE_URL: string;

  @IsOptional()
  @IsString()
  NODE_ENV?: string;
}

export class SupabaseConfig {
  @IsUrl()
  SUPABASE_URL: string;

  @IsString()
  SUPABASE_ANON_KEY: string;
}

export class RedisConfig {
  @IsString()
  REDIS_HOST: string;

  @IsNumber()
  @Min(1)
  @Max(65535)
  REDIS_PORT: number;
}

export class AppConfig {
  @IsNumber()
  @Min(1)
  @Max(65535)
  PORT: number;

  @IsString()
  CORS_ORIGIN: string;

  @IsOptional()
  @IsString()
  HOST?: string;
}

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
}));

export const supabaseConfig = registerAs('supabase', () => ({
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
}));

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  host: process.env.HOST || 'localhost',
}));
