// data-source.ts
import { DataSource } from 'typeorm';
import { User } from './auth/user.entity';
import { UsersLocation } from './locations/locations.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, UsersLocation],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});
