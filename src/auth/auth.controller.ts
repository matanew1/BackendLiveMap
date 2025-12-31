import {
  Controller,
  Post,
  Body,
  Get,
  Headers,
  UseGuards,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Req,
  Delete,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiExtraModels,
} from '@nestjs/swagger';
import type { Request } from 'express';

declare module 'express' {
  interface Request {
    user?: any;
    authResult?: any;
  }
}
import { AuthService } from './auth.service';
import { SupabaseAuthGuard } from './auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User, UserRole } from './user.entity';
import {
  SignUpDto,
  SignInDto,
  RefreshTokenDto,
  UpdateRoleDto,
  UpdateProfileDto,
} from './dto/auth.dto';

@ApiExtraModels(User)
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute for signup
  @ApiOperation({ summary: 'Sign up a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid email or password',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async signUp(@Body() signUpDto: SignUpDto) {
    try {
      const result = await this.authService.signUp(
        signUpDto.email,
        signUpDto.password,
      );

      if (result.success) {
        return {
          statusCode: HttpStatus.CREATED,
          message: result.message,
          data: result.data,
        };
      } else {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: result.message,
            error: result.error,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'An unexpected error occurred during signup.',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('signin')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute for signin
  @ApiOperation({ summary: 'Sign in user' })
  @ApiResponse({ status: 200, description: 'User signed in successfully' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid credentials',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async signIn(@Body() signInDto: SignInDto) {
    try {
      const result = await this.authService.signIn(
        signInDto.email,
        signInDto.password,
      );

      if (result.success) {
        return {
          statusCode: HttpStatus.OK,
          message: result.message,
          data: result.data,
        };
      } else {
        throw new HttpException(
          {
            statusCode: HttpStatus.UNAUTHORIZED,
            message: result.message,
            error: result.error,
          },
          HttpStatus.UNAUTHORIZED,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'An unexpected error occurred during signin.',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('signout')
  @ApiOperation({ summary: 'Sign out user' })
  @ApiResponse({ status: 200, description: 'User signed out successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Sign out failed' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard)
  async signOut() {
    try {
      const result = await this.authService.signOut();

      if (result.success) {
        return {
          statusCode: HttpStatus.OK,
          message: result.message,
        };
      } else {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: result.message,
            error: result.error,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'An unexpected error occurred during signout.',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({ status: 200, description: 'User info retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard)
  async getUser(@Req() request: Request) {
    try {
      return {
        statusCode: HttpStatus.OK,
        message: 'User information retrieved successfully.',
        data: request.user,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message:
            'An unexpected error occurred while getting user information.',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 400, description: 'Refresh failed' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    try {
      const result = await this.authService.refreshToken(
        refreshTokenDto.refreshToken,
      );

      if (result.success) {
        return {
          statusCode: HttpStatus.OK,
          message: result.message,
          data: result.data,
        };
      } else {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: result.message,
            error: result.error,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'An unexpected error occurred during token refresh.',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard)
  async getProfile(@Req() request: Request) {
    try {
      const profile = await this.authService.getUserProfile(request.user.id);

      if (profile.success) {
        return {
          statusCode: HttpStatus.OK,
          message: profile.message,
          data: profile.data,
        };
      } else {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            message: profile.message,
          },
          HttpStatus.NOT_FOUND,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'An unexpected error occurred while getting profile.',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('role/:userId')
  @ApiOperation({ summary: 'Update user role (admin only)' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateRole(
    @Param('userId') userId: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    try {
      const result = await this.authService.updateUserRole(
        userId,
        updateRoleDto.role,
      );

      if (result.success) {
        return {
          statusCode: HttpStatus.OK,
          message: result.message,
          data: result.data,
        };
      } else {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: result.message,
            error: result.error,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'An unexpected error occurred while updating role.',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number' },
        message: { type: 'string' },
        data: { $ref: '#/components/schemas/User' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard)
  async updateProfile(
    @Req() request: Request,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    try {
      const result = await this.authService.updateUserProfile(
        request.user.id,
        updateProfileDto,
      );

      if (result.success) {
        return {
          statusCode: HttpStatus.OK,
          message: result.message,
          data: result.data,
        };
      } else {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: result.message,
            error: result.error,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'An unexpected error occurred while updating profile.',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
