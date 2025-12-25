// seed.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LocationsService } from './locations/locations.service';

async function seed() {
  console.log('Starting seed...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(LocationsService);

  // Get starting point coordinates from command line args or env vars
  const latArg = process.argv[2] || process.env.SEED_LAT || '32.0811944503777';
  const lngArg = process.argv[3] || process.env.SEED_LNG || '34.8907372674565';

  if (!latArg || !lngArg) {
    console.error(
      'Please provide lat and lng as arguments or set SEED_LAT and SEED_LNG environment variables.',
    );
    console.error('Usage: ts-node src/seed.ts <lat> <lng>');
    process.exit(1);
  }

  const myLocation = { lat: parseFloat(latArg), lng: parseFloat(lngArg) };
  const radiusMeters = 500;

  // Generate test users within 500m radius
  const testUsers = [
    { userId: 'test-user-1', distance: 0, bearing: 0 }, // Exact location provided by user
    { userId: 'test-user-2', distance: 50, bearing: 45 }, // 50m Northeast
    { userId: 'test-user-3', distance: 100, bearing: 90 }, // 100m East
    { userId: 'test-user-4', distance: 150, bearing: 135 }, // 150m Southeast
    { userId: 'test-user-5', distance: 200, bearing: 180 }, // 200m South
    { userId: 'test-user-6', distance: 250, bearing: 225 }, // 250m Southwest
    { userId: 'test-user-7', distance: 300, bearing: 270 }, // 300m West
    { userId: 'test-user-8', distance: 350, bearing: 315 }, // 350m Northwest
    { userId: 'test-user-9', distance: 400, bearing: 0 }, // 400m North
    { userId: 'test-user-10', distance: 450, bearing: 120 }, // 450m East-southeast
  ];

  // Function to calculate new coordinates from distance and bearing
  function calculateDestination(
    lat: number,
    lng: number,
    distance: number,
    bearing: number,
  ) {
    const R = 6371000; // Earth's radius in meters
    const d = distance / R; // Angular distance
    const bearingRad = (bearing * Math.PI) / 180; // Convert bearing to radians

    const latRad = (lat * Math.PI) / 180;
    const lngRad = (lng * Math.PI) / 180;

    const newLatRad = Math.asin(
      Math.sin(latRad) * Math.cos(d) +
        Math.cos(latRad) * Math.sin(d) * Math.cos(bearingRad),
    );

    const newLngRad =
      lngRad +
      Math.atan2(
        Math.sin(bearingRad) * Math.sin(d) * Math.cos(latRad),
        Math.cos(d) - Math.sin(latRad) * Math.sin(newLatRad),
      );

    return {
      lat: (newLatRad * 180) / Math.PI,
      lng: (newLngRad * 180) / Math.PI,
    };
  }

  for (const user of testUsers) {
    try {
      let coords;

      if (user.distance === 0) {
        // Use exact coordinates for test-user-1
        coords = {
          lat: myLocation.lat,
          lng: myLocation.lng,
        };
      } else {
        // Calculate coordinates for other users
        coords = calculateDestination(
          myLocation.lat,
          myLocation.lng,
          user.distance,
          user.bearing,
        );
      }

      await service.saveLocation(user.userId, coords.lat, coords.lng);
      console.log(
        `Inserted ${user.userId}: ${user.distance}m away at bearing ${user.bearing}° -`,
        {
          lat: coords.lat.toFixed(6),
          lng: coords.lng.toFixed(6),
        },
      );
    } catch (error) {
      console.error(`Error inserting ${user.userId}:`, error);
    }
  }

  console.log(
    `\nSeeded ${testUsers.length} test users within ${radiusMeters}m radius of:`,
    myLocation,
  );
  await app.close();
}

seed();
