import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, UserRole } from './user.entity';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and anon key must be provided');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async signUp(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          message:
            'Failed to create account. Please check your email and password.',
          error: error.message,
        };
      }

      // Create user profile in DB
      if (data.user) {
        await this.userRepo.save({
          id: data.user.id,
          email: data.user.email,
        });
      }

      return {
        success: true,
        message:
          'Account created successfully. Please check your email for verification.',
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: 'An unexpected error occurred during signup.',
        error: error.message,
      };
    }
  }

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          message: 'Invalid email or password. Please check your credentials.',
          error: error.message,
        };
      }

      return {
        success: true,
        message: 'Signed in successfully.',
        data,
      };
    } catch (error) {
      return {
        success: false,
        message: 'An unexpected error occurred during signin.',
        error: error.message,
      };
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

  async getUserProfile(userId: string) {
    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        return {
          success: false,
          message: 'User profile not found.',
        };
      }
      return {
        success: true,
        message: 'User profile retrieved.',
        data: user,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error retrieving user profile.',
        error: error.message,
      };
    }
  }

  async updateUserRole(userId: string, role: UserRole) {
    try {
      await this.userRepo.update(userId, { role });
      return {
        success: true,
        message: 'User role updated.',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error updating user role.',
        error: error.message,
      };
    }
  }

  async resetPassword(email: string) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
      });
      if (error) {
        return {
          success: false,
          message: 'Failed to send reset email.',
          error: error.message,
        };
      }
      return {
        success: true,
        message: 'Password reset email sent.',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error sending reset email.',
        error: error.message,
      };
    }
  }

  async verifyEmail(token: string) {
    try {
      const { error } = await this.supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email',
      });
      if (error) {
        return {
          success: false,
          message: 'Email verification failed.',
          error: error.message,
        };
      }
      return {
        success: true,
        message: 'Email verified successfully.',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error verifying email.',
        error: error.message,
      };
    }
  }
}
