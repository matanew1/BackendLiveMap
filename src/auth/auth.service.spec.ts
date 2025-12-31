import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';

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
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'supabase.url':
                  return 'mock-url';
                case 'supabase.anonKey':
                  return 'mock-key';
                case 'supabase.serviceRoleKey':
                  return 'mock-service-role-key';
                case 'app.jwtSecret':
                  return 'mock-jwt-secret';
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
      expect(result.data.accessToken).toBeDefined();
      expect(result.data.user.id).toBe('123');
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

  // Removed uploadAvatar and updateAvatar tests - functionality moved to upload.service
});
