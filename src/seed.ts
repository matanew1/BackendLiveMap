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
  const radiusMeters = 5000; // Extended to 5km radius for broader coverage

  // Generate realistic users with dog information
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
      distance: 100,
      bearing: 36,
    },
    {
      id: 'user-003',
      email: 'emma.davis@example.com',
      dogName: 'Charlie',
      dogBreed: 'Beagle',
      dogAge: 4,
      distance: 200,
      bearing: 72,
    },
    {
      id: 'user-004',
      email: 'alex.rodriguez@example.com',
      dogName: 'Luna',
      dogBreed: 'Border Collie',
      dogAge: 1,
      distance: 300,
      bearing: 108,
    },
    {
      id: 'user-005',
      email: 'lisa.wilson@example.com',
      dogName: 'Rocky',
      dogBreed: 'German Shepherd',
      dogAge: 5,
      distance: 400,
      bearing: 144,
    },
    {
      id: 'user-006',
      email: 'david.kim@example.com',
      dogName: 'Daisy',
      dogBreed: 'Poodle',
      dogAge: 2,
      distance: 500,
      bearing: 180,
    },
    {
      id: 'user-007',
      email: 'anna.martinez@example.com',
      dogName: 'Buddy',
      dogBreed: 'Bulldog',
      dogAge: 3,
      distance: 600,
      bearing: 216,
    },
    {
      id: 'user-008',
      email: 'james.taylor@example.com',
      dogName: 'Sadie',
      dogBreed: 'Boxer',
      dogAge: 4,
      distance: 700,
      bearing: 252,
    },
    {
      id: 'user-009',
      email: 'olivia.brown@example.com',
      dogName: 'Bailey',
      dogBreed: 'Shih Tzu',
      dogAge: 1,
      distance: 800,
      bearing: 288,
    },
    {
      id: 'user-010',
      email: 'ryan.garcia@example.com',
      dogName: 'Molly',
      dogBreed: 'Chihuahua',
      dogAge: 6,
      distance: 900,
      bearing: 324,
    },
    {
      id: 'user-011',
      email: 'dominik.json@example.com',
      dogName: 'Toby',
      dogBreed: 'Dachshund',
      dogAge: 2,
      distance: 1000,
      bearing: 0,
    },
    {
      id: 'user-012',
      email: 'erik.rose@example.com',
      dogName: 'Coco',
      dogBreed: 'Rottweiler',
      dogAge: 3,
      distance: 1100,
      bearing: 45,
    },
    {
      id: 'user-013',
      email: 'samantha.lee@example.com',
      dogName: 'Bear',
      dogBreed: 'Bernese Mountain Dog',
      dogAge: 2,
      distance: 1200,
      bearing: 90,
    },
    {
      id: 'user-014',
      email: 'chris.anderson@example.com',
      dogName: 'Zoe',
      dogBreed: 'Siberian Husky',
      dogAge: 4,
      distance: 1300,
      bearing: 135,
    },
    {
      id: 'user-015',
      email: 'natalie.white@example.com',
      dogName: 'Teddy',
      dogBreed: 'Cavalier King Charles Spaniel',
      dogAge: 3,
      distance: 1400,
      bearing: 180,
    },
    {
      id: 'user-016',
      email: 'brandon.miller@example.com',
      dogName: 'Ruby',
      dogBreed: 'Australian Shepherd',
      dogAge: 2,
      distance: 1500,
      bearing: 225,
    },
    {
      id: 'user-017',
      email: 'jessica.moore@example.com',
      dogName: 'Jack',
      dogBreed: 'Great Dane',
      dogAge: 1,
      distance: 1600,
      bearing: 270,
    },
    {
      id: 'user-018',
      email: 'tyler.jones@example.com',
      dogName: 'Lily',
      dogBreed: 'French Bulldog',
      dogAge: 3,
      distance: 1700,
      bearing: 315,
    },
    {
      id: 'user-019',
      email: 'hannah.williams@example.com',
      dogName: 'Oscar',
      dogBreed: 'Boston Terrier',
      dogAge: 4,
      distance: 1800,
      bearing: 0,
    },
    {
      id: 'user-020',
      email: 'austin.brown@example.com',
      dogName: 'Maggie',
      dogBreed: 'Cocker Spaniel',
      dogAge: 5,
      distance: 1900,
      bearing: 60,
    },
    {
      id: 'user-021',
      email: 'madison.davis@example.com',
      dogName: 'Sam',
      dogBreed: 'Staffordshire Bull Terrier',
      dogAge: 2,
      distance: 2000,
      bearing: 120,
    },
    {
      id: 'user-022',
      email: 'jordan.garcia@example.com',
      dogName: 'Sophie',
      dogBreed: 'Pug',
      dogAge: 3,
      distance: 2100,
      bearing: 180,
    },
    {
      id: 'user-023',
      email: 'taylor.martinez@example.com',
      dogName: 'Henry',
      dogBreed: 'Maltese',
      dogAge: 4,
      distance: 2200,
      bearing: 240,
    },
    {
      id: 'user-024',
      email: 'alexander.rodriguez@example.com',
      dogName: 'Nala',
      dogBreed: 'Yorkshire Terrier',
      dogAge: 1,
      distance: 2300,
      bearing: 300,
    },
    {
      id: 'user-025',
      email: 'kayla.lopez@example.com',
      dogName: 'Leo',
      dogBreed: 'Doberman Pinscher',
      dogAge: 3,
      distance: 2400,
      bearing: 15,
    },
    {
      id: 'user-026',
      email: 'cameron.gonzalez@example.com',
      dogName: 'Mia',
      dogBreed: 'Miniature Schnauzer',
      dogAge: 2,
      distance: 2500,
      bearing: 75,
    },
    {
      id: 'user-027',
      email: 'brooklyn.wilson@example.com',
      dogName: 'Finn',
      dogBreed: 'Shiba Inu',
      dogAge: 1,
      distance: 2600,
      bearing: 135,
    },
    {
      id: 'user-028',
      email: 'gabriel.anderson@example.com',
      dogName: 'Piper',
      dogBreed: 'Whippet',
      dogAge: 4,
      distance: 2700,
      bearing: 195,
    },
    {
      id: 'user-029',
      email: 'savannah.thomas@example.com',
      dogName: 'Ollie',
      dogBreed: 'Basset Hound',
      dogAge: 5,
      distance: 2800,
      bearing: 255,
    },
    {
      id: 'user-030',
      email: 'christian.jackson@example.com',
      dogName: 'Rosie',
      dogBreed: 'Pembroke Welsh Corgi',
      dogAge: 2,
      distance: 2900,
      bearing: 315,
    },
    {
      id: 'user-031',
      email: 'avery.white@example.com',
      dogName: 'Bentley',
      dogBreed: 'Standard Poodle',
      dogAge: 3,
      distance: 3000,
      bearing: 30,
    },
    {
      id: 'user-032',
      email: 'scarlett.harris@example.com',
      dogName: 'Lola',
      dogBreed: 'Mastiff',
      dogAge: 1,
      distance: 3100,
      bearing: 90,
    },
    {
      id: 'user-033',
      email: 'jackson.clark@example.com',
      dogName: 'Zeus',
      dogBreed: 'Alaskan Malamute',
      dogAge: 4,
      distance: 3200,
      bearing: 150,
    },
    {
      id: 'user-034',
      email: 'victoria.lewis@example.com',
      dogName: 'Penny',
      dogBreed: 'Havanese',
      dogAge: 3,
      distance: 3300,
      bearing: 210,
    },
    {
      id: 'user-035',
      email: 'jayden.walker@example.com',
      dogName: 'Rex',
      dogBreed: 'American Bulldog',
      dogAge: 5,
      distance: 3400,
      bearing: 270,
    },
    {
      id: 'user-036',
      email: 'zoey.hall@example.com',
      dogName: 'Belle',
      dogBreed: 'Portuguese Water Dog',
      dogAge: 2,
      distance: 3500,
      bearing: 330,
    },
    {
      id: 'user-037',
      email: 'grayson.allen@example.com',
      dogName: 'Duke',
      dogBreed: 'Irish Wolfhound',
      dogAge: 1,
      distance: 3600,
      bearing: 45,
    },
    {
      id: 'user-038',
      email: 'layla.young@example.com',
      dogName: 'Lucy',
      dogBreed: 'Old English Sheepdog',
      dogAge: 4,
      distance: 3700,
      bearing: 105,
    },
    {
      id: 'user-039',
      email: 'liam.king@example.com',
      dogName: 'Milo',
      dogBreed: 'Bernese Mountain Dog',
      dogAge: 3,
      distance: 3800,
      bearing: 165,
    },
    {
      id: 'user-040',
      email: 'nora.wright@example.com',
      dogName: 'Sasha',
      dogBreed: 'Akita',
      dogAge: 2,
      distance: 3900,
      bearing: 225,
    },
    {
      id: 'user-041',
      email: 'mason.lopez@example.com',
      dogName: 'Gus',
      dogBreed: 'Bloodhound',
      dogAge: 6,
      distance: 4000,
      bearing: 285,
    },
    {
      id: 'user-042',
      email: 'riley.scott@example.com',
      dogName: 'Cleo',
      dogBreed: 'Chinese Crested',
      dogAge: 1,
      distance: 4100,
      bearing: 345,
    },
    {
      id: 'user-043',
      email: 'levi.green@example.com',
      dogName: 'Bruno',
      dogBreed: 'Neapolitan Mastiff',
      dogAge: 3,
      distance: 4200,
      bearing: 60,
    },
    {
      id: 'user-044',
      email: 'ellie.adams@example.com',
      dogName: 'Diesel',
      dogBreed: 'Pit Bull',
      dogAge: 4,
      distance: 4300,
      bearing: 120,
    },
    {
      id: 'user-045',
      email: 'asher.baker@example.com',
      dogName: 'Mocha',
      dogBreed: 'Lhasa Apso',
      dogAge: 2,
      distance: 4400,
      bearing: 180,
    },
    {
      id: 'user-046',
      email: 'stella.nelson@example.com',
      dogName: 'Thor',
      dogBreed: 'Cane Corso',
      dogAge: 3,
      distance: 4500,
      bearing: 240,
    },
    {
      id: 'user-047',
      email: 'ezra.carter@example.com',
      dogName: 'Willow',
      dogBreed: 'Samoyed',
      dogAge: 1,
      distance: 4600,
      bearing: 300,
    },
    {
      id: 'user-048',
      email: 'hazel.mitchell@example.com',
      dogName: 'Rusty',
      dogBreed: 'Irish Setter',
      dogAge: 4,
      distance: 4700,
      bearing: 15,
    },
    {
      id: 'user-049',
      email: 'luke.perez@example.com',
      dogName: 'Jasmine',
      dogBreed: 'Afghan Hound',
      dogAge: 2,
      distance: 4800,
      bearing: 75,
    },
    {
      id: 'user-050',
      email: 'aurora.roberts@example.com',
      dogName: 'Ace',
      dogBreed: 'Dalmatian',
      dogAge: 3,
      distance: 4900,
      bearing: 135,
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
