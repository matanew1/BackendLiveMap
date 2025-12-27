import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD } from '@nestjs/core';
import { LocationsModule } from './locations/locations.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import {
  databaseConfig,
  supabaseConfig,
  redisConfig,
  appConfig,
} from './config/configuration';
import { ConfigValidationService } from './config/config-validation.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, supabaseConfig, redisConfig, appConfig],
      validate: (config) => {
        const validationService = new ConfigValidationService(
          new ConfigService(config),
          config,
        );
        validationService.validateConfiguration();
        return config;
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 10, // 10 requests per minute
      },
    ]),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        store: 'redis',
        host: configService.get('redis.host'),
        port: configService.get('redis.port'),
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('database.url'),
        ssl:
          configService.get('database.synchronize') === false
            ? { rejectUnauthorized: false }
            : false,
        autoLoadEntities: true,
        synchronize: false, // Use migrations instead
        migrationsRun: false, // Don't run migrations automatically on startup
        logging: configService.get('database.logging'),
        migrations: ['dist/src/migrations/*.js'],
        cli: {
          migrationsDir: 'src/migrations',
        },
        extra: {
          max: 50, // Increased from 20
          min: 5, // Maintain minimum connections
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
          acquireTimeoutMillis: 60000, // Prevent hanging connections
        },
      }),
      inject: [ConfigService],
    }),
    LocationsModule,
    AuthModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
