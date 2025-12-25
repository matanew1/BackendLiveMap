// locations.entity.ts
import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('users_locations')
export class UsersLocation {
  @PrimaryColumn('varchar')
  user_id: string;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location: string;

  @Column({ type: 'timestamp', default: () => 'now()' })
  last_updated: Date;
}
