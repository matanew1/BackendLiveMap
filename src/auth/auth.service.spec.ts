import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
    },
    storage: {
      listBuckets: jest.fn(),
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
      })),
    },
  })),
}));

describe('AuthService', () => {
  let service: AuthService;
  let supabaseClient: SupabaseClient;

  beforeEach(async () => {
    // Mock environment variables
    process.env.SUPABASE_URL = 'mock-url';
    process.env.SUPABASE_ANON_KEY = 'mock-key';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'supabase.url':
                  return 'mock-url';
                case 'supabase.anonKey':
                  return 'mock-key';
                default:
                  return undefined;
              }
            }),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            save: jest.fn(),
            findOne: jest.fn(),
            query: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Mock the supabase methods on the service instance
    const mockSupabase = {
      auth: {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        getUser: jest.fn(),
      },
      storage: {
        listBuckets: jest.fn(),
        from: jest.fn(() => ({
          upload: jest.fn(),
          getPublicUrl: jest.fn(),
        })),
      },
    };
    service['supabase'] = mockSupabase as any;
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signUp', () => {
    it('should sign up a user successfully', async () => {
      const mockResponse = {
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null,
      };
      service['supabase'].auth.signUp.mockResolvedValue(mockResponse);

      const result = await service.signUp('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.data.user.email).toBe('test@example.com');
      expect(service['supabase'].auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should handle sign up error', async () => {
      const mockResponse = {
        data: null,
        error: { message: 'Email already registered' },
      };
      service['supabase'].auth.signUp.mockResolvedValue(mockResponse);

      const result = await service.signUp('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        'Failed to create account. Please check your email and password.',
      );
      expect(result.error).toBe('Email already registered');
    });
  });

  describe('signIn', () => {
    it('should sign in a user successfully', async () => {
      const mockResponse = {
        data: {
          user: { id: '123', email: 'test@example.com' },
          session: { access_token: 'token123' },
        },
        error: null,
      };
      service['supabase'].auth.signInWithPassword.mockResolvedValue(
        mockResponse,
      );

      const result = await service.signIn('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.data.session.access_token).toBe('token123');
    });

    it('should handle sign in error', async () => {
      const mockResponse = {
        data: null,
        error: { message: 'Invalid credentials' },
      };
      service['supabase'].auth.signInWithPassword.mockResolvedValue(
        mockResponse,
      );

      const result = await service.signIn('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });
  });

  describe('getUser', () => {
    it('should get user from token', async () => {
      const mockResponse = {
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null,
      };
      service['supabase'].auth.getUser.mockResolvedValue(mockResponse);

      const result = await service.getUser('token123');

      expect(result.success).toBe(true);
      expect(result.data.user.id).toBe('123');
    });
  });

  describe('getUserProfile', () => {
    it('should get user profile', async () => {
      // Mock the database query
      const mockUser = { id: '123', email: 'test@example.com', role: 'USER' };
      jest
        .spyOn(service['userRepo'], 'findOne')
        .mockResolvedValue(mockUser as any);

      const result = await service.getUserProfile('123');

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('123');
    });
  });

  describe('uploadAvatar', () => {
    const mockFile = {
      buffer: Buffer.from('fake-image-data'),
      mimetype: 'image/jpeg',
      originalname: 'test.jpg',
      size: 1024,
    } as Express.Multer.File;

    beforeEach(() => {
      // Mock createClient for authenticated client
      const mockCreateClient = jest.fn(() => ({
        storage: {
          listBuckets: jest.fn(),
          from: jest.fn(() => ({
            upload: jest.fn(),
            getPublicUrl: jest.fn(),
          })),
        },
      }));
      (createClient as jest.Mock).mockImplementation(mockCreateClient);

      // Reset the main supabase mock for each test
      service['supabase'].storage.from.mockClear();
    });

    it('should upload avatar successfully', async () => {
      // Mock successful upload for authenticated client
      const mockStorageFrom = {
        upload: jest.fn().mockResolvedValue({
          data: { path: 'user123-1234567890.jpg' },
          error: null,
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: {
            publicUrl: 'https://supabase-url/avatars/user123-1234567890.jpg',
          },
        }),
      };

      // Mock the createClient to return a client with the mocked storage
      const mockAuthClient = {
        storage: {
          from: jest.fn().mockReturnValue(mockStorageFrom),
        },
      };
      (createClient as jest.Mock).mockReturnValueOnce(mockAuthClient);

      // Mock user update
      jest.spyOn(service['userRepo'], 'update').mockResolvedValue({} as any);

      const result = await service.uploadAvatar(
        'user123',
        mockFile,
        'jwt-token',
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Avatar uploaded successfully.');
      expect(result.data.avatarUrl).toBe(
        'https://supabase-url/avatars/user123-1234567890.jpg',
      );
      expect(service['userRepo'].update).toHaveBeenCalledWith('user123', {
        avatarUrl: 'https://supabase-url/avatars/user123-1234567890.jpg',
      });
    });

    it('should fail when upload fails', async () => {
      // Mock upload error
      const mockUpload = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Upload failed: File too large' },
      });

      service['supabase'].storage.from.mockReturnValue({
        upload: mockUpload,
      });

      const result = await service.uploadAvatar('user123', mockFile);

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        'Error uploading avatar: Upload failed: File too large',
      );
      expect(result.error).toBe('Upload failed: File too large');
    });

    // Mock upload error
    const mockStorageFrom = {
      upload: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Upload failed: File too large' },
      }),
      getPublicUrl: jest.fn(),
    };
    service['supabase'].storage.from.mockReturnValue(mockStorageFrom);

    const result = await service.uploadAvatar('user123', mockFile);

    expect(result.success).toBe(false);
    expect(result.message).toBe(
      'Error uploading avatar: Upload failed: File too large',
    );
    expect(result.error).toBe('Upload failed: File too large');
  });

  it('should handle unexpected errors', async () => {
    // Mock upload throws error
    const mockStorageFrom = {
      upload: jest.fn().mockRejectedValue(new Error('Network error')),
      getPublicUrl: jest.fn(),
    };
    service['supabase'].storage.from.mockReturnValue(mockStorageFrom);

    const result = await service.uploadAvatar('user123', mockFile);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Error uploading avatar.');
    expect(result.error).toBe('Network error');
  });

  it('should use authenticated client when token is provided', async () => {
    // Mock successful upload
    const mockStorageFrom = service['supabase'].storage.from('avatars');
    mockStorageFrom.upload.mockResolvedValue({
      data: { path: 'user123-1234567890.jpg' },
      error: null,
    });
    mockStorageFrom.getPublicUrl.mockReturnValue({
      data: {
        publicUrl: 'https://supabase-url/avatars/user123-1234567890.jpg',
      },
    });

    // Mock user update
    jest.spyOn(service['userRepo'], 'update').mockResolvedValue({} as any);

    await service.uploadAvatar('user123', mockFile, 'jwt-token');
  });
});

describe('updateAvatar', () => {
  const mockFile = {
    buffer: Buffer.from('fake image data'),
    mimetype: 'image/jpeg',
    originalname: 'avatar.jpg',
  } as Express.Multer.File;

  it('should update avatar successfully', async () => {
    // Mock user lookup
    const mockUser = { id: 'user123', avatarUrl: 'old-avatar-url' };
    jest
      .spyOn(service['userRepo'], 'findOne')
      .mockResolvedValue(mockUser as any);

    // Mock Supabase storage
    const mockUpload = jest.fn().mockResolvedValue({ data: {}, error: null });
    const mockGetPublicUrl = jest
      .fn()
      .mockReturnValue({ data: { publicUrl: 'new-avatar-url' } });

    service['supabase'].storage.from.mockReturnValue({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
    });

    // Mock user update
    jest.spyOn(service['userRepo'], 'update').mockResolvedValue({} as any);

    const result = await service.updateAvatar('user123', mockFile);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Avatar updated successfully.');
    expect(result.data.avatarUrl).toBe('new-avatar-url');
    expect(result.data.previousAvatarUrl).toBe('old-avatar-url');
    expect(mockUpload).toHaveBeenCalledWith(
      'users/user123/avatar.jpg',
      mockFile.buffer,
      {
        contentType: 'image/jpeg',
        upsert: true,
      },
    );
  });

  it('should return error if user not found', async () => {
    jest.spyOn(service['userRepo'], 'findOne').mockResolvedValue(null);

    const result = await service.updateAvatar('user123', mockFile);

    expect(result.success).toBe(false);
    expect(result.message).toBe('User not found.');
  });

  it('should handle storage upload error', async () => {
    // Mock user lookup
    const mockUser = { id: 'user123', avatarUrl: null };
    jest
      .spyOn(service['userRepo'], 'findOne')
      .mockResolvedValue(mockUser as any);

    // Mock Supabase storage error
    const mockUpload = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Storage error' },
    });

    service['supabase'].storage.from.mockReturnValue({
      upload: mockUpload,
    });

    const result = await service.updateAvatar('user123', mockFile);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Error updating avatar: Storage error');
  });

  it('should use authenticated client when token provided', async () => {
    // Mock user lookup
    const mockUser = { id: 'user123', avatarUrl: null };
    jest
      .spyOn(service['userRepo'], 'findOne')
      .mockResolvedValue(mockUser as any);

    // Mock Supabase storage
    const mockUpload = jest.fn().mockResolvedValue({ data: {}, error: null });
    const mockGetPublicUrl = jest
      .fn()
      .mockReturnValue({ data: { publicUrl: 'new-avatar-url' } });

    service['supabase'].storage.from.mockReturnValue({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
    });

    // Mock user update
    jest.spyOn(service['userRepo'], 'update').mockResolvedValue({} as any);

    await service.updateAvatar('user123', mockFile, 'jwt-token');

    // Verify createClient was called with token
    expect(createClient).toHaveBeenCalledWith('mock-url', 'mock-key', {
      global: {
        headers: {
          Authorization: `Bearer jwt-token`,
        },
      },
    });
  });
});

describe('deleteAvatar', () => {
  const mockFile = {
    buffer: Buffer.from('test'),
    mimetype: 'image/jpeg',
  } as Express.Multer.File;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock config service
    jest
      .spyOn(service['configService'], 'get')
      .mockImplementation((key: string) => {
        if (key === 'supabase.url') return 'mock-url';
        if (key === 'supabase.anonKey') return 'mock-key';
        return undefined;
      });
  });

  it('should delete avatar successfully', async () => {
    const mockUser = { id: 'user123', avatarUrl: 'old-avatar-url' };

    // Mock user lookup
    jest
      .spyOn(service['userRepo'], 'findOne')
      .mockResolvedValue(mockUser as any);

    // Mock storage delete
    const mockRemove = jest.fn().mockResolvedValue({ error: null });
    service['supabase'].storage.from.mockReturnValue({
      remove: mockRemove,
    });

    // Mock user update
    jest.spyOn(service['userRepo'], 'update').mockResolvedValue({} as any);

    const result = await service.deleteAvatar('user123');

    expect(result.success).toBe(true);
    expect(result.message).toBe('Avatar deleted successfully.');
    expect(result.data).toEqual({ previousAvatarUrl: 'old-avatar-url' });
    expect(mockRemove).toHaveBeenCalledWith(['users/user123/avatar.jpg']);
    expect(service['userRepo'].update).toHaveBeenCalledWith('user123', {
      avatarUrl: null,
    });
  });

  it('should return error if user not found', async () => {
    jest.spyOn(service['userRepo'], 'findOne').mockResolvedValue(null);

    const result = await service.deleteAvatar('user123');

    expect(result.success).toBe(false);
    expect(result.message).toBe('User not found.');
  });

  it('should return error if user has no avatar', async () => {
    const mockUser = { id: 'user123', avatarUrl: null };
    jest
      .spyOn(service['userRepo'], 'findOne')
      .mockResolvedValue(mockUser as any);

    const result = await service.deleteAvatar('user123');

    expect(result.success).toBe(false);
    expect(result.message).toBe('User has no avatar to delete.');
  });

  it('should handle storage delete error', async () => {
    const mockUser = { id: 'user123', avatarUrl: 'old-avatar-url' };
    jest
      .spyOn(service['userRepo'], 'findOne')
      .mockResolvedValue(mockUser as any);

    const mockRemove = jest
      .fn()
      .mockResolvedValue({ error: { message: 'Storage error' } });
    service['supabase'].storage.from.mockReturnValue({
      remove: mockRemove,
    });

    const result = await service.deleteAvatar('user123');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Error deleting avatar: Storage error');
  });

  it('should use authenticated client when token provided', async () => {
    const mockUser = { id: 'user123', avatarUrl: 'old-avatar-url' };
    jest
      .spyOn(service['userRepo'], 'findOne')
      .mockResolvedValue(mockUser as any);

    const mockRemove = jest.fn().mockResolvedValue({ error: null });
    const mockFrom = jest.fn().mockReturnValue({ remove: mockRemove });

    (createClient as jest.Mock).mockReturnValue({
      storage: { from: mockFrom },
    });

    jest.spyOn(service['userRepo'], 'update').mockResolvedValue({} as any);

    await service.deleteAvatar('user123', 'jwt-token');

    // Verify createClient was called with token
    expect(createClient).toHaveBeenCalledWith('mock-url', 'mock-key', {
      global: {
        headers: {
          Authorization: `Bearer jwt-token`,
        },
      },
    });
  });
});
