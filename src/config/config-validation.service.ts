import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { validateSync } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  DatabaseConfig,
  SupabaseConfig,
  RedisConfig,
  AppConfig,
} from './configuration';

@Injectable()
export class ConfigValidationService {
  constructor(
    private configService?: ConfigService,
    private rawConfig?: any,
  ) {}

  validateConfiguration() {
    // Validate Database config
    const dbConfig = plainToClass(DatabaseConfig, {
      DATABASE_URL: this.rawConfig?.DATABASE_URL,
      NODE_ENV: this.rawConfig?.NODE_ENV,
    });
    const dbErrors = validateSync(dbConfig);
    if (dbErrors.length > 0) {
      const errorMessages = dbErrors
        .map((error) => Object.values(error.constraints || {}).join(', '))
        .join('; ');
      throw new Error(
        `Database configuration validation failed: ${errorMessages}`,
      );
    }

    // Validate Supabase config
    const supabaseConfig = plainToClass(SupabaseConfig, {
      SUPABASE_URL: this.rawConfig?.SUPABASE_URL,
      SUPABASE_ANON_KEY: this.rawConfig?.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: this.rawConfig?.SUPABASE_SERVICE_ROLE_KEY,
    });
    const supabaseErrors = validateSync(supabaseConfig);
    if (supabaseErrors.length > 0) {
      const errorMessages = supabaseErrors
        .map((error) => Object.values(error.constraints || {}).join(', '))
        .join('; ');
      throw new Error(
        `Supabase configuration validation failed: ${errorMessages}`,
      );
    }

    // Validate Redis config
    const redisConfig = plainToClass(RedisConfig, {
      REDIS_HOST: this.rawConfig?.REDIS_HOST,
      REDIS_PORT: parseInt(this.rawConfig?.REDIS_PORT || '6379', 10),
    });
    const redisErrors = validateSync(redisConfig);
    if (redisErrors.length > 0) {
      const errorMessages = redisErrors
        .map((error) => Object.values(error.constraints || {}).join(', '))
        .join('; ');
      throw new Error(
        `Redis configuration validation failed: ${errorMessages}`,
      );
    }

    // Validate App config
    const appConfig = plainToClass(AppConfig, {
      PORT: parseInt(this.rawConfig?.PORT || '3000', 10),
      CORS_ORIGIN: this.rawConfig?.CORS_ORIGIN,
      JWT_SECRET: this.rawConfig?.JWT_SECRET,
    });
    const appErrors = validateSync(appConfig);
    if (appErrors.length > 0) {
      const errorMessages = appErrors
        .map((error) => Object.values(error.constraints || {}).join(', '))
        .join('; ');
      throw new Error(`App configuration validation failed: ${errorMessages}`);
    }
  }
}
