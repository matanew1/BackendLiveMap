import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, UserRole } from './user.entity';
import { ApiResponse } from '../common/dto/api-response.dto';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private configService: ConfigService,
    private jwtService: JwtService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const supabaseKey = this.configService.get<string>(
      'supabase.serviceRoleKey',
    );

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and service role key must be provided');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async signUp(email: string, password: string): Promise<ApiResponse> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return ApiResponse.error(
          'Failed to create account. Please check your email and password.',
          error.message,
        );
      }

      // Create user profile in DB
      if (data.user) {
        await this.userRepo.save({
          id: data.user.id,
          email: data.user.email,
        });
      }

      return ApiResponse.success(
        data,
        'Account created successfully. Please check your email for verification.',
      );
    } catch (error) {
      return ApiResponse.error(
        'An unexpected error occurred during signup.',
        error.message,
      );
    }
  }

  async signIn(email: string, password: string): Promise<ApiResponse> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return ApiResponse.error(
          'Invalid email or password. Please check your credentials.',
          error.message,
        );
      }

      // Generate JWT token
      const payload = {
        sub: data.user.id,
        email: data.user.email,
      };
      const accessToken = this.jwtService.sign(payload);

      return ApiResponse.success(
        {
          accessToken,
          user: data.user,
        },
        'Signed in successfully.',
      );
    } catch (error) {
      return ApiResponse.error(
        'An unexpected error occurred during signin.',
        error.message,
      );
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        return {
          success: false,
          message: 'Failed to sign out.',
          error: error.message,
        };
      }

      return {
        success: true,
        message: 'Signed out successfully.',
      };
    } catch (error) {
      return {
        success: false,
        message: 'An unexpected error occurred during signout.',
        error: error.message,
      };
    }
  }

  async getUser(token: string) {
    try {
      const { data, error } = await this.supabase.auth.getUser(token);

      if (error) {
        return {
          success: false,
          message: 'Failed to get user information.',
          error: error.message,
        };
      }

      return {
        success: true,
        message: 'User information retrieved successfully.',
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: 'An unexpected error occurred while getting user information.',
        error: error.message,
      };
    }
  }

  async getUserProfile(userId: string): Promise<ApiResponse<User>> {
    const cacheKey = `user_profile:${userId}`;
    const cached = await this.cacheManager.get<ApiResponse<User>>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        return ApiResponse.error('User profile not found.');
      }
      const result = ApiResponse.success(user, 'User profile retrieved.');
      await this.cacheManager.set(cacheKey, result, 300000); // 5 minutes TTL
      return result;
    } catch (error) {
      return ApiResponse.error('Error retrieving user profile.', error.message);
    }
  }

  async updateUserRole(userId: string, role: UserRole) {
    try {
      const updatedUser = await this.userRepo.update(userId, { role });
      await this.cacheManager.del(`user_profile:${userId}`); // Invalidate cache
      return {
        success: true,
        message: 'User role updated.',
        data: updatedUser,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error updating user role.',
        error: error.message,
      };
    }
  }

  async updateUserProfile(userId: string, profileData: Partial<User>) {
    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        return {
          success: false,
          message: 'User not found.',
        };
      }

      await this.userRepo.update(userId, profileData);
      const updatedUser = await this.userRepo.findOne({
        where: { id: userId },
      });

      await this.cacheManager.del(`user_profile:${userId}`); // Invalidate cache

      return {
        success: true,
        message: 'Profile updated.',
        data: updatedUser,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error updating profile.',
        error: error.message,
      };
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const { data, error } = await this.supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error) {
        return {
          success: false,
          message: 'Failed to refresh token.',
          error: error.message,
        };
      }

      return {
        success: true,
        message: 'Token refreshed successfully.',
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error refreshing token.',
        error: error.message,
      };
    }
  }
}
