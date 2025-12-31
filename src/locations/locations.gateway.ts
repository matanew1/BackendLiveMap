import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LocationsService } from './locations.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
})
export class LocationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private userRadii = new Map<string, number>();

  constructor(private readonly service: LocationsService) {}

  handleConnection(client: Socket) {
    console.log(`Connection established: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Connection closed: ${client.id}`);
  }

  //subscribe means listen to this event
  @SubscribeMessage('update_location')
  async handleLocationUpdate(
    @MessageBody()
    data: {
      userId: string;
      lat: number;
      lng: number;
      filters?: { breed?: string };
    },
  ) {
    if (!data.userId) return;

    // 1. Persist to PostGIS
    await this.service.saveLocation(data.userId, data.lat, data.lng);

    // 2. Get customized nearby list
    const radius = this.userRadii.get(data.userId) || 500;
    const nearby = await this.service.getUsersNearby(
      data.lat,
      data.lng,
      radius,
      data.filters,
    );

    console.log('Nearby users:', nearby);

    // 3. Broadcast update to the world
    this.server.emit('location_updated', {
      updated: { user_id: data.userId, lat: data.lat, lng: data.lng },
      nearby,
    });
  }

  @SubscribeMessage('update_search_radius')
  async handleRadiusUpdate(
    @MessageBody()
    data: {
      userId: string;
      radius: number;
      filters?: { breed?: string };
    },
  ) {
    if (!data.userId) return;

    this.userRadii.set(data.userId, data.radius);

    // Get user's current location
    const userLocation = await this.service.getUserLocation(data.userId);
    if (!userLocation) return; // No location saved yet

    // Get nearby users with new radius
    const nearby = await this.service.getUsersNearby(
      userLocation.lat,
      userLocation.lng,
      data.radius,
      data.filters,
    );

    console.log('Nearby users after radius update:', nearby);

    // Emit updated nearby list
    this.server.emit('location_updated', {
      updated: {
        user_id: data.userId,
        lat: userLocation.lat,
        lng: userLocation.lng,
      },
      nearby,
    });
  }
}
