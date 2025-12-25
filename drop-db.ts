import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DataSource } from 'typeorm';

async function dropDatabase() {
  try {
    console.log('Dropping database...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    await dataSource.query('DROP SCHEMA public CASCADE');
    await dataSource.query('CREATE SCHEMA public');

    console.log('Database dropped successfully!');
    await app.close();
  } catch (error) {
    console.error('Error dropping database:', error);
  }
}

dropDatabase();
