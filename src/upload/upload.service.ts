import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User } from '../auth/user.entity';
import { ApiResponse } from '../common/dto/api-response.dto';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private supabase: SupabaseClient;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private configService: ConfigService,
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

  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
    token?: string,
  ): Promise<ApiResponse> {
    try {
      // Check if user already has an avatar
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        return ApiResponse.error('User not found.');
      }

      if (user.avatarUrl) {
        return ApiResponse.error(
          'User already has an avatar. Use the update endpoint (PATCH /upload/avatar) to replace it.',
        );
      }

      const fileName = `users/${userId}/avatar_${Date.now()}.jpg`; // Unique filename to avoid caching

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
      this.logger.log('Attempting to upload file to avatars bucket...');
      const { data, error } = await client.storage
        .from('avatars') // assuming bucket name is 'avatars'
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false, // Use unique filename, no upsert needed
        });

      if (error) {
        this.logger.error('Supabase storage upload error:', error);
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

      this.logger.log('Upload successful, getting public URL...');

      const { data: publicUrl } = client.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add timestamp to bust cache
      const cacheBustedUrl = `${publicUrl.publicUrl}?t=${Date.now()}`;

      // Update user avatarUrl
      await this.userRepo.update(userId, { avatarUrl: cacheBustedUrl });

      return {
        success: true,
        message: 'Avatar uploaded successfully.',
        data: { avatarUrl: cacheBustedUrl },
      };
    } catch (error) {
      this.logger.error('Unexpected error in uploadAvatar:', error);
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

      const fileName = `users/${userId}/avatar_${Date.now()}.jpg`; // Unique filename to avoid caching

      this.logger.log(`UpdateAvatar - User found: ${userId}`);
      this.logger.log(`UpdateAvatar - Current avatarUrl: ${user.avatarUrl}`);
      this.logger.log(`UpdateAvatar - New fileName: ${fileName}`);
      this.logger.log('UpdateAvatar - File details:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        bufferLength: file.buffer?.length,
      });

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

      this.logger.log(
        `UpdateAvatar - Using client type: ${token ? 'authenticated' : 'service_role'}`,
      );
      this.logger.log(`Updating existing avatar for user: ${userId}`);

      // Upload new avatar with unique filename
      const { data, error } = await client.storage
        .from('avatars')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false, // Don't upsert since we're using unique names
        });

      if (error) {
        this.logger.error('Supabase storage update error:', error);
        return {
          success: false,
          message: `Error updating avatar: ${error.message}`,
          error: error.message,
        };
      }

      this.logger.log('UpdateAvatar - Upload successful, data:', data);

      // If there was a previous avatar, try to clean it up
      if (user.avatarUrl) {
        try {
          // Extract the path from the previous URL
          const urlParts = user.avatarUrl.split(
            '/storage/v1/object/public/avatars/',
          )[1];
          const oldFileName = urlParts?.split('?')[0]; // Remove query params
          if (oldFileName && oldFileName !== fileName) {
            this.logger.log(
              `UpdateAvatar - Attempting to clean up old file: ${oldFileName}`,
            );
            const { error: cleanupError } = await client.storage
              .from('avatars')
              .remove([oldFileName]);
            if (cleanupError) {
              this.logger.log(
                `UpdateAvatar - Cleanup warning (non-critical): ${cleanupError.message}`,
              );
            } else {
              this.logger.log('UpdateAvatar - Old file cleaned up successfully');
            }
          }
        } catch (cleanupError) {
          this.logger.log(
            `UpdateAvatar - Cleanup failed (non-critical): ${cleanupError}`,
          );
        }
      }
      this.logger.log('Avatar updated successfully, getting public URL...');

      const { data: publicUrl } = client.storage
        .from('avatars')
        .getPublicUrl(fileName);

      this.logger.log(`UpdateAvatar - Public URL: ${publicUrl.publicUrl}`);

      // Add timestamp to bust cache
      const cacheBustedUrl = `${publicUrl.publicUrl}?t=${Date.now()}`;

      this.logger.log(`UpdateAvatar - Cache busted URL: ${cacheBustedUrl}`);

      // Update user avatarUrl in database
      await this.userRepo.update(userId, { avatarUrl: cacheBustedUrl });

      this.logger.log('UpdateAvatar - Database updated successfully');

      return {
        success: true,
        message: 'Avatar updated successfully.',
        data: {
          avatarUrl: cacheBustedUrl,
          previousAvatarUrl: user.avatarUrl,
        },
      };
    } catch (error) {
      this.logger.error('Unexpected error in updateAvatar:', error);
      return {
        success: false,
        message: 'Error updating avatar.',
        error: error.message,
      };
    }
  }

  async deleteAvatar(userId: string, token?: string): Promise<ApiResponse> {
    try {
      // Check if user exists and has an avatar
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        return ApiResponse.error('User not found.');
      }

      if (!user.avatarUrl) {
        return ApiResponse.error('User has no avatar to delete.');
      }

      // Extract the actual filename from the avatar URL
      const urlParts = user.avatarUrl.split(
        '/storage/v1/object/public/avatars/',
      )[1];
      const fileName = urlParts?.split('?')[0]; // Remove query params like ?t=timestamp

      if (!fileName) {
        console.error(
          'Could not extract filename from avatar URL:',
          user.avatarUrl,
        );
        return ApiResponse.error('Invalid avatar URL format.');
      }

      console.log('DeleteAvatar - Extracted filename:', fileName);

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

      console.log('Deleting avatar for user:', userId);
      console.log('DeleteAvatar - Avatar URL:', user.avatarUrl);

      // Delete the file from storage
      const { error } = await client.storage.from('avatars').remove([fileName]);

      if (error) {
        console.error('Supabase storage delete error:', error);
        return {
          success: false,
          message: `Error deleting avatar: ${error.message}`,
          error: error.message,
        };
      }

      console.log('DeleteAvatar - File deleted successfully from storage');

      // Clear avatarUrl in database
      await this.userRepo.update(userId, { avatarUrl: null as any });

      console.log('DeleteAvatar - Database updated successfully');

      return {
        success: true,
        message: 'Avatar deleted successfully.',
        data: {
          previousAvatarUrl: user.avatarUrl,
        },
      };
    } catch (error) {
      console.error('Unexpected error in deleteAvatar:', error);
      return {
        success: false,
        message: 'Error deleting avatar.',
        error: error.message,
      };
    }
  }
}
