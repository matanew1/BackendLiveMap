# Cy-Dog Backend

A NestJS backend application for the Cy-Dog platform, built with TypeScript, TypeORM, Supabase, and PostgreSQL with PostGIS.

## Features

- 🔐 **Authentication**: User signup/signin with Supabase Auth
- 📍 **Location Services**: Real-time location tracking with WebSocket support
- 🖼️ **Avatar Upload**: User avatar management with organized storage
- 🏥 **Health Checks**: Application health monitoring
- 📚 **API Documentation**: Swagger/OpenAPI documentation
- 🗄️ **Database**: PostgreSQL with PostGIS for geospatial data
- 🔄 **Real-time**: Socket.IO integration for live updates
- 🧪 **Testing**: Comprehensive unit and e2e tests with Jest

## Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL + PostGIS
- **ORM**: TypeORM
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-time**: Socket.IO
- **Caching**: Redis
- **Testing**: Jest
- **API Docs**: Swagger/OpenAPI

## Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL with PostGIS
- Redis (optional, for caching)
- Supabase account

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cy-dog-backend
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/cy_dog

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Server
PORT=3000
HOST=localhost

# Redis (optional)
REDIS_URL=redis://localhost:6379
```

4. Set up the database:
```bash
pnpm run migration:run
```

5. Seed the database (optional):
```bash
pnpm run seed
```

## Running the Application

### Development
```bash
pnpm run start:dev
```

### Production
```bash
pnpm run build
pnpm run start:prod
```

### Docker
```bash
docker build -t cy-dog-backend .
docker run -p 3000:3000 cy-dog-backend
```

## API Documentation

Once the application is running, visit:
- **Swagger UI**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

## API Endpoints

### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/signin` - User login
- `POST /auth/signout` - User logout
- `POST /auth/refresh` - Refresh access token
- `POST /auth/upload-avatar` - Upload user avatar
- `PATCH /auth/avatar` - Update existing user avatar

### Locations
- `GET /locations` - Get locations
- `POST /locations` - Create location
- WebSocket events for real-time location updates

### Health
- `GET /health` - Application health status

## Supabase Setup

### Storage Bucket
1. Create an "avatars" bucket in Supabase Storage
2. Make it public
3. Add RLS policies:

**Insert Policy** (for uploads):
```sql
CREATE POLICY "Allow authenticated users to upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);
```

**Select Policy** (for viewing):
```sql
CREATE POLICY "Allow public access to view" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');
```

### Avatar Storage Structure
Avatars are stored in the following structure:
```
avatars/
  users/
    {userId}/
      avatar.jpg
```

Frontend can access avatars via:
```
https://your-project.supabase.co/storage/v1/object/public/avatars/users/{userId}/avatar.jpg
```

## Testing

### Unit Tests
```bash
pnpm run test
```

### E2E Tests
```bash
pnpm run test:e2e
```

### Test Coverage
```bash
pnpm run test:cov
```

## Database Migrations

### Create Migration
```bash
pnpm run migration:create -- -n MigrationName
```

### Run Migrations
```bash
pnpm run migration:run
```

### Revert Migration
```bash
pnpm run migration:revert
```

## Project Structure

```
src/
├── auth/                 # Authentication module
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.guard.ts
│   ├── user.entity.ts
│   └── dto/
├── common/               # Shared utilities
│   ├── decorators/
│   ├── dto/
│   ├── filters/
│   ├── guards/
│   └── interceptors/
├── config/               # Configuration
├── health/               # Health checks
├── locations/            # Location services
└── migrations/           # Database migrations
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `SUPABASE_URL` | Supabase project URL | Required |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Required |
| `PORT` | Server port | 3000 |
| `HOST` | Server host | localhost |
| `REDIS_URL` | Redis connection URL | Optional |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Getting started

### Install the CLI

Available via [NPM](https://www.npmjs.com) as dev dependency. To install:

```bash
npm i supabase --save-dev
```

When installing with yarn 4, you need to disable experimental fetch with the following nodejs config.

```
NODE_OPTIONS=--no-experimental-fetch yarn add supabase
```

> **Note**
For Bun versions below v1.0.17, you must add `supabase` as a [trusted dependency](https://bun.sh/guides/install/trusted) before running `bun add -D supabase`.

<details>
  <summary><b>macOS</b></summary>

  Available via [Homebrew](https://brew.sh). To install:

  ```sh
  brew install supabase/tap/supabase
  ```

  To install the beta release channel:
  
  ```sh
  brew install supabase/tap/supabase-beta
  brew link --overwrite supabase-beta
  ```
  
  To upgrade:

  ```sh
  brew upgrade supabase
  ```
</details>

<details>
  <summary><b>Windows</b></summary>

  Available via [Scoop](https://scoop.sh). To install:

  ```powershell
  scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
  scoop install supabase
  ```

  To upgrade:

  ```powershell
  scoop update supabase
  ```
</details>

<details>
  <summary><b>Linux</b></summary>

  Available via [Homebrew](https://brew.sh) and Linux packages.

  #### via Homebrew

  To install:

  ```sh
  brew install supabase/tap/supabase
  ```

  To upgrade:

  ```sh
  brew upgrade supabase
  ```

  #### via Linux packages

  Linux packages are provided in [Releases](https://github.com/supabase/cli/releases). To install, download the `.apk`/`.deb`/`.rpm`/`.pkg.tar.zst` file depending on your package manager and run the respective commands.

  ```sh
  sudo apk add --allow-untrusted <...>.apk
  ```

  ```sh
  sudo dpkg -i <...>.deb
  ```

  ```sh
  sudo rpm -i <...>.rpm
  ```

  ```sh
  sudo pacman -U <...>.pkg.tar.zst
  ```
</details>

<details>
  <summary><b>Other Platforms</b></summary>

  You can also install the CLI via [go modules](https://go.dev/ref/mod#go-install) without the help of package managers.

  ```sh
  go install github.com/supabase/cli@latest
  ```

  Add a symlink to the binary in `$PATH` for easier access:

  ```sh
  ln -s "$(go env GOPATH)/bin/cli" /usr/bin/supabase
  ```

  This works on other non-standard Linux distros.
</details>

<details>
  <summary><b>Community Maintained Packages</b></summary>

  Available via [pkgx](https://pkgx.sh/). Package script [here](https://github.com/pkgxdev/pantry/blob/main/projects/supabase.com/cli/package.yml).
  To install in your working directory:

  ```bash
  pkgx install supabase
  ```

  Available via [Nixpkgs](https://nixos.org/). Package script [here](https://github.com/NixOS/nixpkgs/blob/master/pkgs/development/tools/supabase-cli/default.nix).
</details>

### Run the CLI

```bash
supabase bootstrap
```

Or using npx:

```bash
npx supabase bootstrap
```

The bootstrap command will guide you through the process of setting up a Supabase project using one of the [starter](https://github.com/supabase-community/supabase-samples/blob/main/samples.json) templates.

## Docs

Command & config reference can be found [here](https://supabase.com/docs/reference/cli/about).

## Breaking changes

We follow semantic versioning for changes that directly impact CLI commands, flags, and configurations.

However, due to dependencies on other service images, we cannot guarantee that schema migrations, seed.sql, and generated types will always work for the same CLI major version. If you need such guarantees, we encourage you to pin a specific version of CLI in package.json.

## Developing

To run from source:

```sh
# Go >= 1.22
go run . help
```
