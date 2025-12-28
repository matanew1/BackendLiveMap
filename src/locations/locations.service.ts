import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { UsersLocation } from './locations.entity';
import { User } from '../auth/user.entity';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(UsersLocation)
    private readonly repo: Repository<UsersLocation>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    // Database initialization moved to migrations
  }

  async saveLocation(userId: string, lat: number, lng: number): Promise<any> {
    const result = await this.repo.query(
      `
      INSERT INTO users_locations (user_id, location)
      VALUES ($1, ST_MakePoint($2, $3)::geography)
      ON CONFLICT (user_id)
      DO UPDATE SET location = ST_MakePoint($2, $3)::geography, last_updated = now()
      RETURNING *;
      `,
      [userId, lng, lat],
    );

    // Also update the user's lastLocation
    await this.userRepo.query(
      `UPDATE users SET "lastLocation" = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE id = $3`,
      [lng, lat, userId],
    );

    return result;
  }

  async getUsersNearby(
    lat: number,
    lng: number,
    radiusMeters: number,
    filters: { breed?: string; limit?: number; offset?: number } = {},
  ) {
    const cacheKey = `nearby:${lat}:${lng}:${radiusMeters}:${JSON.stringify(filters)}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    let query = `
      SELECT ul.user_id,
             ST_Y(ul.location::geometry) AS lat,
             ST_X(ul.location::geometry) AS lng,
             ST_Distance(ul.location, ST_MakePoint($2, $1)::geography) AS distance,
             u."dogBreed", u."dogName", u."avatarUrl"
      FROM users_locations ul
      LEFT JOIN users u ON ul.user_id = u.id
      WHERE ST_DWithin(ul.location, ST_MakePoint($2, $1)::geography, $3)
    `;

    const params: any[] = [lat, lng, radiusMeters];
    let paramIndex = 4;

    if (filters.breed) {
      query += ` AND u."dogBreed" = $${paramIndex}`;
      params.push(filters.breed);
      paramIndex++;
    }

    query += ` ORDER BY distance ASC`;

    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }

    if (filters.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(filters.offset);
    }

    const result = await this.repo.query(query, params);
    await this.cacheManager.set(cacheKey, result, 300000); // 5 min cache
    return result;
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
