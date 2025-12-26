# WebSocket API Documentation

## WebSocket Events

**Connection URL:** `ws://localhost:3000`

### Events

#### 1. Update Location
**Event:** `update_location`

Update user's location and get nearby users.

**Client → Server:**
```json
{
  "userId": "uuid",
  "lat": 37.7749,
  "lng": -122.4194,
  "filters": {
    "breed": "Golden Retriever"
  }
}
```

#### 2. Update Search Radius
**Event:** `update_search_radius`

Update search radius for nearby users.

**Client → Server:**
```json
{
  "userId": "uuid",
  "radius": 1000,
  "filters": {
    "breed": "Labrador"
  }
}
```

#### 3. Location Updated (Broadcast)
**Event:** `location_updated`

Broadcast location updates and nearby users.

**Server → All Clients:**
```json
{
  "updated": {
    "user_id": "uuid",
    "lat": 37.7749,
    "lng": -122.4194
  },
  "nearby": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "dogName": "Buddy",
      "dogBreed": "Golden Retriever",
      "dogAge": 3,
      "lat": 37.7750,
      "lng": -122.4195,
      "distance": 150.5
    }
  ]
}
```

### WebSocket Usage Example

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

// Connect
socket.on('connect', () => {
  console.log('Connected to server');
});

// Update location
socket.emit('update_location', {
  userId: 'user-uuid',
  lat: 37.7749,
  lng: -122.4194,
  filters: { breed: 'Golden Retriever' }
});

// Listen for updates
socket.on('location_updated', (data) => {
  console.log('Location updated:', data);
});

// Update search radius
socket.emit('update_search_radius', {
  userId: 'user-uuid',
  radius: 2000,
  filters: { breed: 'Labrador' }
});

// Disconnect
socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

## Notes

- The `userId` must be a valid user UUID from your authentication system
- Filters are optional and currently support `breed` filtering
- Default search radius is 500 meters if not set
- All location data is persisted to the PostGIS database
- The server broadcasts updates to all connected clients
- CORS is configured to allow connections from the specified origin

For production, make sure to:
- Use secure WebSocket connections (WSS)
- Implement proper authentication if needed
- Handle connection errors and reconnections
- Update the connection URL to your production server