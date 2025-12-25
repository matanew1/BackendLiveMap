import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersLocation } from './locations.entity';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(UsersLocation)
    private readonly repo: Repository<UsersLocation>,
  ) {
    this.initDatabase();
  }

  private async initDatabase() {
    await this.repo.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);
    await this.repo.query(`
      CREATE INDEX IF NOT EXISTS location_gist_idx ON users_locations USING GIST (location);
    `);
  }

  async saveLocation(userId: string, lat: number, lng: number) {
    return this.repo.query(
      `
      INSERT INTO users_locations (user_id, location)
      VALUES ($1, ST_MakePoint($2, $3)::geography)
      ON CONFLICT (user_id)
      DO UPDATE SET location = ST_MakePoint($2, $3)::geography, last_updated = now()
      RETURNING *;
      `,
      [userId, lng, lat],
    );
  }

  async getUsersNearby(lat: number, lng: number, radiusMeters: number) {
    return this.repo.query(
      `
      SELECT user_id,
             ST_Y(location::geometry) AS lat,
             ST_X(location::geometry) AS lng,
             ST_Distance(location, ST_MakePoint($2, $1)::geography) AS distance
      FROM users_locations
      WHERE ST_DWithin(location, ST_MakePoint($2, $1)::geography, $3)
      ORDER BY distance ASC;
      `,
      [lat, lng, radiusMeters],
    );
  }

  async getUserLocation(userId: string) {
    const result = await this.repo.query(
      `
      SELECT ST_Y(location::geometry) AS lat,
             ST_X(location::geometry) AS lng
      FROM users_locations
      WHERE user_id = $1;
      `,
      [userId],
    );
    return result[0] || null;
  }
}
