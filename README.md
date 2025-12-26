# Cy-Dog Backend API

A NestJS-based backend API for the Cy-Dog application, providing authentication, location tracking, and real-time communication features for dog owners.

## Features

- 🔐 **Authentication**: User signup/signin with Supabase Auth
- 📍 **Location Tracking**: Real-time GPS location sharing with WebSocket
- 🐕 **Dog Profiles**: User profiles with dog information
- 🔄 **Real-time Updates**: WebSocket-based location broadcasting
- 📊 **Health Monitoring**: Application health checks
- 📚 **API Documentation**: Interactive Swagger UI

## Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL with PostGIS
- **Authentication**: Supabase Auth
- **Cache**: Redis
- **WebSocket**: Socket.IO
- **ORM**: TypeORM
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI

## Quick Start

### Prerequisites

- Node.js (v18+)
- pnpm
- PostgreSQL with PostGIS
- Redis
- Supabase account

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd cy-dog-backend

# Install dependencies
pnpm install
```

### Environment Setup

Copy the environment file and configure:

```bash
cp .env.example .env
```

Update `.env` with your configuration:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/cy_dog_db

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Server
PORT=3000
CORS_ORIGIN=http://localhost:8081

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Running the Application

```bash
# Development mode
pnpm run start:dev

# Production build
pnpm run build
pnpm run start:prod
```

### Database Setup

```bash
# Run migrations
pnpm run migration:run

# Seed initial data (if available)
pnpm run seed
```

## API Documentation

### Base URL
```
http://localhost:3000
```

### Authentication
All protected endpoints require a Bearer token:
```
Authorization: Bearer <your-jwt-token>
```

## REST API Endpoints

### Authentication Module (`/auth`)

#### 1. Sign Up
**POST** `/auth/signup`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "strongpassword123"
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "message": "Account created successfully. Please check your email for verification.",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    },
    "session": {
      "access_token": "jwt_token",
      "refresh_token": "refresh_token"
    }
  }
}
```

#### 2. Sign In
**POST** `/auth/signin`

Authenticate user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "strongpassword123"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Signed in successfully.",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    },
    "session": {
      "access_token": "jwt_token",
      "refresh_token": "refresh_token"
    }
  }
}
```

#### 3. Sign Out
**POST** `/auth/signout`

Sign out current user.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Signed out successfully."
}
```

#### 4. Get Current User
**GET** `/auth/me`

Get authenticated user information.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "User information retrieved successfully.",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    },
    "session": {
      "access_token": "jwt_token",
      "refresh_token": "refresh_token"
    }
  }
}
```

#### 5. Refresh Token
**POST** `/auth/refresh`

Refresh access token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Token refreshed successfully.",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    },
    "session": {
      "access_token": "new_jwt_token",
      "refresh_token": "new_refresh_token"
    }
  }
}
```

#### 6. Get User Profile
**GET** `/auth/profile`

Get user profile with dog information.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "User profile retrieved.",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "dogName": "Buddy",
    "dogBreed": "Golden Retriever",
    "dogAge": 3,
    "role": "USER"
  }
}
```

#### 7. Update User Profile
**PATCH** `/auth/profile`

Update user profile information.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "dogName": "Buddy",
  "dogBreed": "Golden Retriever",
  "dogAge": 3
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "Profile updated."
}
```

#### 8. Update User Role (Admin Only)
**PATCH** `/auth/role/:userId`

Update user role (admin only).

**Headers:** `Authorization: Bearer <admin_token>`

**URL Params:** `userId` (string)

**Request Body:**
```json
{
  "role": "ADMIN"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "message": "User role updated."
}
```

### Health Check Module (`/health`)

#### 1. Health Check
**GET** `/health`

Check application health status.

**Response (200):**
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    },
    "memory_heap": {
      "status": "up"
    },
    "memory_rss": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    },
    "memory_heap": {
      "status": "up",
      "memory_heap": {
        "used": 123456789,
        "available": 150000000
      }
    },
    "memory_rss": {
      "status": "up",
      "memory_rss": {
        "used": 123456789,
        "available": 150000000
      }
    }
  }
}
```

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

## Development

### Project Structure

```
src/
├── auth/                 # Authentication module
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.guard.ts
│   ├── user.entity.ts
│   └── auth.service.spec.ts
├── common/               # Shared utilities
│   ├── dto/
│   ├── filters/
│   ├── guards/
│   └── interceptors/
├── config/               # Configuration
├── health/               # Health checks
├── locations/            # Location tracking
│   ├── locations.gateway.ts
│   ├── locations.service.ts
│   └── locations.service.spec.ts
├── migrations/           # Database migrations
├── app.module.ts         # Main application module
├── data-source.ts        # Database configuration
└── main.ts               # Application entry point
```

### Available Scripts

```bash
# Development
pnpm run start:dev          # Start in watch mode
pnpm run start:prod         # Start production build

# Building
pnpm run build              # Build the application
pnpm run format             # Format code with Prettier

# Testing
pnpm run test               # Run unit tests
pnpm run test:e2e           # Run e2e tests
pnpm run test:cov           # Run tests with coverage

# Database
pnpm run migration:run      # Run migrations
pnpm run migration:generate # Generate migration
pnpm run migration:create   # Create migration

# Linting
pnpm run lint               # Run ESLint
pnpm run lint:fix           # Fix linting issues
```

### API Documentation

Interactive API documentation is available at:
- **Swagger UI**: `http://localhost:3000/api`
- **Health Check**: `http://localhost:3000/health`

## Deployment

### Docker

```dockerfile
# Build the application
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production image
FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `SUPABASE_URL` | Supabase project URL | Required |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Required |
| `PORT` | Server port | 3000 |
| `HOST` | Server host | localhost |
| `CORS_ORIGIN` | Allowed CORS origins | http://localhost:3000 |
| `REDIS_HOST` | Redis host | localhost |
| `REDIS_PORT` | Redis port | 6379 |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please contact the development team or create an issue in the repository.
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
