// seed.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LocationsService } from './locations/locations.service';
import { Repository, DataSource } from 'typeorm';
import { User } from './auth/user.entity';

async function seed() {
  console.log('Starting seed...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(LocationsService);

  // Get DataSource and create user repository
  const dataSource = app.get(DataSource);
  const userRepository = dataSource.getRepository(User);

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

  // Generate 10 realistic users with dog information
  const realUsers = [
    {
      id: 'user-001',
      email: 'sarah.johnson@example.com',
      dogName: 'Max',
      dogBreed: 'Golden Retriever',
      dogAge: 3,
      distance: 0,
      bearing: 0,
    },
    {
      id: 'user-002',
      email: 'mike.chen@example.com',
      dogName: 'Bella',
      dogBreed: 'Labrador',
      dogAge: 2,
      distance: 50,
      bearing: 45,
    },
    {
      id: 'user-003',
      email: 'emma.davis@example.com',
      dogName: 'Charlie',
      dogBreed: 'Beagle',
      dogAge: 4,
      distance: 100,
      bearing: 90,
    },
    {
      id: 'user-004',
      email: 'alex.rodriguez@example.com',
      dogName: 'Luna',
      dogBreed: 'Border Collie',
      dogAge: 1,
      distance: 150,
      bearing: 135,
    },
    {
      id: 'user-005',
      email: 'lisa.wilson@example.com',
      dogName: 'Rocky',
      dogBreed: 'German Shepherd',
      dogAge: 5,
      distance: 200,
      bearing: 180,
    },
    {
      id: 'user-006',
      email: 'david.kim@example.com',
      dogName: 'Daisy',
      dogBreed: 'Poodle',
      dogAge: 2,
      distance: 250,
      bearing: 225,
    },
    {
      id: 'user-007',
      email: 'anna.martinez@example.com',
      dogName: 'Buddy',
      dogBreed: 'Bulldog',
      dogAge: 3,
      distance: 300,
      bearing: 270,
    },
    {
      id: 'user-008',
      email: 'james.taylor@example.com',
      dogName: 'Sadie',
      dogBreed: 'Boxer',
      dogAge: 4,
      distance: 350,
      bearing: 315,
    },
    {
      id: 'user-009',
      email: 'olivia.brown@example.com',
      dogName: 'Bailey',
      dogBreed: 'Shih Tzu',
      dogAge: 1,
      distance: 400,
      bearing: 0,
    },
    {
      id: 'user-010',
      email: 'ryan.garcia@example.com',
      dogName: 'Molly',
      dogBreed: 'Chihuahua',
      dogAge: 6,
      distance: 450,
      bearing: 120,
    },
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

  for (const userData of realUsers) {
    try {
      let coords;

      if (userData.distance === 0) {
        // Use exact coordinates for the first user
        coords = {
          lat: myLocation.lat,
          lng: myLocation.lng,
        };
      } else {
        // Calculate coordinates for other users
        coords = calculateDestination(
          myLocation.lat,
          myLocation.lng,
          userData.distance,
          userData.bearing,
        );
      }

      // Create user record
      const user = new User();
      user.id = userData.id;
      user.email = userData.email;
      user.dogName = userData.dogName;
      user.dogBreed = userData.dogBreed;
      user.dogAge = userData.dogAge;

      // Save user to database
      await userRepository.save(user);
      console.log(
        `Created user: ${userData.dogName} (${userData.dogBreed}) - ${userData.email}`,
      );

      // Save user location
      await service.saveLocation(userData.id, coords.lat, coords.lng);
      console.log(
        `  Location: ${userData.distance}m away at bearing ${userData.bearing}° -`,
        {
          lat: coords.lat.toFixed(6),
          lng: coords.lng.toFixed(6),
        },
      );
    } catch (error) {
      console.error(`Error creating user ${userData.id}:`, error);
    }
  }

  console.log(
    `\nSeeded ${realUsers.length} real users with dogs within ${radiusMeters}m radius of:`,
    myLocation,
  );
  console.log('Users created with realistic dog information and locations!');
  await app.close();
}

seed();
