// migrations/1735160000000-InitialSchema.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1735160000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable PostGIS extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE users (
        id VARCHAR PRIMARY KEY,
        email VARCHAR UNIQUE NOT NULL,
        role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        "dogName" VARCHAR,
        "dogBreed" VARCHAR,
        "dogAge" INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create users_locations table
    await queryRunner.query(`
      CREATE TABLE users_locations (
        user_id VARCHAR PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        location GEOGRAPHY(Point, 4326) NOT NULL,
        last_updated TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX location_gist_idx ON users_locations USING GIST (location);`,
    );
    await queryRunner.query(`CREATE INDEX users_email_idx ON users (email);`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS users_locations;`);
    await queryRunner.query(`DROP TABLE IF EXISTS users;`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS postgis;`);
  }
}
