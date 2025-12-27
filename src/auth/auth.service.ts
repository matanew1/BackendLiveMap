import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
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
  ) {
    const supabaseUrl = this.configService.get<string>('supabase.url');
    const supabaseKey = this.configService.get<string>('supabase.anonKey');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and anon key must be provided');
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
        'Account created successfully. Please check your email for verification.',
        data,
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

      return ApiResponse.success('Signed in successfully.', data);
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
    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        return ApiResponse.error('User profile not found.');
      }
      return ApiResponse.success('User profile retrieved.', user);
    } catch (error) {
      return ApiResponse.error('Error retrieving user profile.', error.message);
    }
  }

  async updateUserRole(userId: string, role: UserRole) {
    try {
      const updatedUser = await this.userRepo.update(userId, { role });
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

  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
    token?: string,
  ): Promise<ApiResponse> {
    try {
      const fileName = `users/${userId}/avatar.jpg`; // Organize by user folders

      // Create authenticated client if token provided
      const client = token
        ? createClient(
            this.configService.get<string>('supabase.url')!,
            this.configService.get<string>('supabase.anonKey')!,
            {
              global: {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            },
          )
        : this.supabase;

      // Try to upload the file directly to avatars bucket
      console.log('Attempting to upload file to avatars bucket...');
      const { data, error } = await client.storage
        .from('avatars') // assuming bucket name is 'avatars'
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true, // Allow overwriting existing avatar
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        // If the error is about bucket not existing, give a clearer message
        if (
          error.message.includes('not found') ||
          error.message.includes('does not exist')
        ) {
          return {
            success: false,
            message:
              'Avatars storage bucket does not exist. Please create an "avatars" bucket in your Supabase dashboard with public access.',
            error: error.message,
          };
        }
        return {
          success: false,
          message: `Error uploading avatar: ${error.message}`,
          error: error.message,
        };
      }

      console.log('Upload successful, getting public URL...');

      const { data: publicUrl } = client.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update user avatarUrl
      await this.userRepo.update(userId, { avatarUrl: publicUrl.publicUrl });

      return {
        success: true,
        message: 'Avatar uploaded successfully.',
        data: { avatarUrl: publicUrl.publicUrl },
      };
    } catch (error) {
      console.error('Unexpected error in uploadAvatar:', error);
      return {
        success: false,
        message: 'Error uploading avatar.',
        error: error.message,
      };
    }
  }

  async updateAvatar(
    userId: string,
    file: Express.Multer.File,
    token?: string,
  ): Promise<ApiResponse> {
    try {
      // Check if user exists and has an existing avatar
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        return ApiResponse.error('User not found.');
      }

      const fileName = `users/${userId}/avatar.jpg`; // Same path as upload

      // Create authenticated client if token provided
      const client = token
        ? createClient(
            this.configService.get<string>('supabase.url')!,
            this.configService.get<string>('supabase.anonKey')!,
            {
              global: {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            },
          )
        : this.supabase;

      console.log('Updating existing avatar for user:', userId);

      // Upload new avatar (will overwrite existing)
      const { data, error } = await client.storage
        .from('avatars')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true, // Always overwrite existing avatar
        });

      if (error) {
        console.error('Supabase storage update error:', error);
        return {
          success: false,
          message: `Error updating avatar: ${error.message}`,
          error: error.message,
        };
      }

      console.log('Avatar updated successfully, getting public URL...');

      const { data: publicUrl } = client.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update user avatarUrl in database
      await this.userRepo.update(userId, { avatarUrl: publicUrl.publicUrl });

      return {
        success: true,
        message: 'Avatar updated successfully.',
        data: {
          avatarUrl: publicUrl.publicUrl,
          previousAvatarUrl: user.avatarUrl,
        },
      };
    } catch (error) {
      console.error('Unexpected error in updateAvatar:', error);
      return {
        success: false,
        message: 'Error updating avatar.',
        error: error.message,
      };
    }
  }
}
