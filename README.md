# Cy-Dog Backend

A NestJS backend application for the Cy-Dog platform, built with TypeScript, TypeORM, Supabase, and PostgreSQL with PostGIS.

## Features

- 🔐 **Authentication**: User signup/signin with Supabase Auth
- 📍 **Location Services**: Real-time location tracking with WebSocket support and last known location storage
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
- `GET /auth/profile/:userId` - Get user profile
- `PATCH /auth/profile/:userId` - Update user profile (including lastLocation)
- `POST /auth/upload-avatar` - Upload user avatar
- `PATCH /auth/avatar` - Update existing user avatar
- `DELETE /auth/avatar` - Delete user avatar

### Locations
- **WebSocket Events**:
  - `update_location` - Update user location (saves to both users.lastLocation and users_locations table)
  - `update_search_radius` - Update search radius for nearby users
- **Real-time Events**:
  - `location_updated` - Broadcasts location updates and nearby users

### Health
- `GET /health` - Application health status

## Location Features

The application provides advanced location tracking capabilities:

### Dual Location Storage
- **users.lastLocation**: Stores the most recent user location directly in the users table for quick access
- **users_locations table**: Maintains a separate geospatial table for complex queries and historical data

### Real-time Updates
- WebSocket-based location updates with instant broadcasting
- Nearby users discovery with customizable search radius
- Breed-based filtering for dog-specific social features

### Geospatial Queries
- PostGIS-powered distance calculations
- Efficient spatial indexing for performance
- Support for radius-based user discovery

## Supabase Setup

### Storage Bucket
1. Create an "avatars" bucket in Supabase Storage
2. Make it public
3. Add RLS policies:

**Public Read Access** (for viewing avatars):
```sql
CREATE POLICY "Public read access for avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');
```

**Authenticated Upload** (for uploading avatars):
```sql
CREATE POLICY "Allow authenticated users to upload avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);
```

**Update Own Avatar** (for updating existing avatars):
```sql
CREATE POLICY "Allow users to update their own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Delete Own Avatar** (for deleting avatars):
```sql
CREATE POLICY "Allow users to delete their own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
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

## Frontend Integration - Storage API

This section provides comprehensive documentation for frontend developers to integrate with the avatar storage system.

### Avatar URL Structure

Avatars are publicly accessible via Supabase Storage URLs:
```
https://your-project.supabase.co/storage/v1/object/public/avatars/users/{userId}/avatar.jpg
```

**Parameters:**
- `your-project`: Your Supabase project URL
- `userId`: The user's unique identifier
- `avatar.jpg`: Fixed filename for all user avatars

### API Endpoints

#### 1. Upload Avatar
**Endpoint:** `POST /auth/upload-avatar`  
**Authentication:** Required (Bearer token)  
**Content-Type:** `multipart/form-data`

**Request:**
```javascript
const formData = new FormData();
formData.append('file', imageFile); // File object

const response = await fetch('/auth/upload-avatar', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`
  },
  body: formData
});
```

**Response:**
```json
{
  "statusCode": 201,
  "message": "Avatar uploaded successfully.",
  "data": {
    "avatarUrl": "https://your-project.supabase.co/storage/v1/object/public/avatars/users/user123/avatar.jpg"
  }
}
```

#### 2. Update Avatar
**Endpoint:** `PATCH /auth/avatar`  
**Authentication:** Required (Bearer token)  
**Content-Type:** `multipart/form-data`

**Request:**
```javascript
const formData = new FormData();
formData.append('file', newImageFile);

const response = await fetch('/auth/avatar', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${userToken}`
  },
  body: formData
});
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Avatar updated successfully.",
  "data": {
    "avatarUrl": "https://your-project.supabase.co/storage/v1/object/public/avatars/users/user123/avatar.jpg",
    "previousAvatarUrl": "https://your-project.supabase.co/storage/v1/object/public/avatars/users/user123/old-avatar.jpg"
  }
}
```

#### 3. Delete Avatar
**Endpoint:** `DELETE /auth/avatar`  
**Authentication:** Required (Bearer token)

**Request:**
```javascript
const response = await fetch('/auth/avatar', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Avatar deleted successfully.",
  "data": {
    "previousAvatarUrl": "https://your-project.supabase.co/storage/v1/object/public/avatars/users/user123/avatar.jpg"
  }
}
```

### Frontend Examples

#### React/Next.js Example
```javascript
import { useState } from 'react';

function AvatarManager({ userId, token }) {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Upload avatar
  const uploadAvatar = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/auth/upload-avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      if (result.statusCode === 201) {
        setAvatarUrl(result.data.avatarUrl);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  // Update avatar
  const updateAvatar = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/auth/avatar', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      if (result.statusCode === 200) {
        setAvatarUrl(result.data.avatarUrl);
      }
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  // Delete avatar
  const deleteAvatar = async () => {
    try {
      const response = await fetch('/auth/avatar', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (result.statusCode === 200) {
        setAvatarUrl(null);
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  // Get avatar URL for display
  const getAvatarUrl = (userId) => {
    return `https://your-project.supabase.co/storage/v1/object/public/avatars/users/${userId}/avatar.jpg`;
  };

  return (
    <div>
      {avatarUrl && (
        <img src={avatarUrl} alt="Avatar" width="100" height="100" />
      )}

      <input
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files[0] && uploadAvatar(e.target.files[0])}
        disabled={uploading}
      />

      <button onClick={() => updateAvatar(someFile)}>Update Avatar</button>
      <button onClick={deleteAvatar}>Delete Avatar</button>
    </div>
  );
}
```

#### Vue.js Example
```javascript
<template>
  <div>
    <img v-if="avatarUrl" :src="avatarUrl" alt="Avatar" />
    <input type="file" @change="handleFileUpload" accept="image/*" />
    <button @click="deleteAvatar">Delete Avatar</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      avatarUrl: null,
      userToken: localStorage.getItem('authToken')
    }
  },
  methods: {
    async handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/auth/upload-avatar', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.userToken}`
          },
          body: formData
        });

        const result = await response.json();
        if (result.statusCode === 201) {
          this.avatarUrl = result.data.avatarUrl;
        }
      } catch (error) {
        console.error('Upload failed:', error);
      }
    },

    async deleteAvatar() {
      try {
        const response = await fetch('/auth/avatar', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.userToken}`
          }
        });

        const result = await response.json();
        if (result.statusCode === 200) {
          this.avatarUrl = null;
        }
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  },

  computed: {
    avatarDisplayUrl() {
      return `https://your-project.supabase.co/storage/v1/object/public/avatars/users/${this.userId}/avatar.jpg`;
    }
  }
}
</script>
```

#### Angular Example
```typescript
import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-avatar',
  template: `
    <img *ngIf="avatarUrl" [src]="avatarUrl" alt="Avatar" />
    <input type="file" (change)="onFileSelected($event)" accept="image/*" />
    <button (click)="deleteAvatar()">Delete Avatar</button>
  `
})
export class AvatarComponent {
  avatarUrl: string | null = null;
  selectedFile: File | null = null;

  constructor(private http: HttpClient) {}

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      this.uploadAvatar();
    }
  }

  uploadAvatar() {
    if (!this.selectedFile) return;

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });

    this.http.post('/auth/upload-avatar', formData, { headers })
      .subscribe({
        next: (response: any) => {
          if (response.statusCode === 201) {
            this.avatarUrl = response.data.avatarUrl;
          }
        },
        error: (error) => console.error('Upload failed:', error)
      });
  }

  deleteAvatar() {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });

    this.http.delete('/auth/avatar', { headers })
      .subscribe({
        next: (response: any) => {
          if (response.statusCode === 200) {
            this.avatarUrl = null;
          }
        },
        error: (error) => console.error('Delete failed:', error)
      });
  }

  getToken(): string {
    return localStorage.getItem('authToken') || '';
  }

  getAvatarUrl(userId: string): string {
    return `https://your-project.supabase.co/storage/v1/object/public/avatars/users/${userId}/avatar.jpg`;
  }
}
```

### Error Handling

#### Common HTTP Status Codes

| Status Code | Meaning | Action |
|-------------|---------|--------|
| `200` | Success | Operation completed |
| `201` | Created | Avatar uploaded successfully |
| `400` | Bad Request | Invalid file, user not found, or no avatar to delete |
| `401` | Unauthorized | Invalid or missing authentication token |
| `403` | Forbidden | Row Level Security policy violation |
| `500` | Server Error | Internal server error |

#### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Error message description",
  "error": "Detailed error information"
}
```

### File Upload Guidelines

- **Supported Formats:** JPEG, PNG, GIF, WebP
- **Maximum Size:** 5MB (configurable in Supabase)
- **Naming:** All avatars are automatically named `avatar.jpg`
- **Storage:** Files are organized in user-specific folders
- **Public Access:** All avatars are publicly accessible for display

### Authentication

All avatar management endpoints require authentication via Bearer token:

```javascript
headers: {
  'Authorization': `Bearer ${jwtToken}`
}
```

Tokens are obtained through the `/auth/signin` endpoint and should be stored securely (localStorage, secure cookies, etc.).

### Best Practices

1. **Image Optimization:** Compress images before upload to reduce bandwidth
2. **Loading States:** Show loading indicators during upload operations
3. **Error Handling:** Implement proper error handling for all API calls
4. **Caching:** Cache avatar URLs to reduce API calls
5. **Fallback Images:** Provide default avatars when users don't have custom ones
6. **Security:** Never expose authentication tokens in client-side logs

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
