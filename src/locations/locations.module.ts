import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationsGateway } from './locations.gateway';
import { LocationsService } from './locations.service';
import { UsersLocation } from './locations.entity';
import { User } from '../auth/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UsersLocation, User])],
  providers: [LocationsService, LocationsGateway],
})
export class LocationsModule {}
