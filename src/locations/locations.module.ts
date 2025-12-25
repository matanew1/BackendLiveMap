import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationsGateway } from './locations.gateway';
import { LocationsService } from './locations.service';
import { UsersLocation } from './locations.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UsersLocation])],
  providers: [LocationsService, LocationsGateway],
})
export class LocationsModule {}
