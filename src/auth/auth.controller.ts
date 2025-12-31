import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Param,
  Patch,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
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
import { ApiResponse } from '../common/dto/api-response.dto';

@ApiExtraModels(User)
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute for signup
  @ApiOperation({ summary: 'Sign up a new user' })
  @SwaggerApiResponse({ status: 201, description: 'User created successfully' })
  @SwaggerApiResponse({
    status: 400,
    description: 'Bad request - Invalid email or password',
  })
  @SwaggerApiResponse({ status: 500, description: 'Internal server error' })
  async signUp(@Body() signUpDto: SignUpDto) {
    const result = await this.authService.signUp(
      signUpDto.email,
      signUpDto.password,
    );

    if (result.success) {
      return ApiResponse.success(result.data, result.message);
    } else {
      return ApiResponse.error(result.message, result.error);
    }
  }

  @Post('signin')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute for signin
  @ApiOperation({ summary: 'Sign in user' })
  @SwaggerApiResponse({
    status: 200,
    description: 'User signed in successfully',
  })
  @SwaggerApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid credentials',
  })
  @SwaggerApiResponse({ status: 500, description: 'Internal server error' })
  async signIn(@Body() signInDto: SignInDto) {
    const result = await this.authService.signIn(
      signInDto.email,
      signInDto.password,
    );

    if (result.success) {
      return ApiResponse.success(result.data, result.message);
    } else {
      return ApiResponse.error(result.message, result.error);
    }
  }

  @Post('signout')
  @ApiOperation({ summary: 'Sign out user' })
  @SwaggerApiResponse({
    status: 200,
    description: 'User signed out successfully',
  })
  @SwaggerApiResponse({
    status: 400,
    description: 'Bad request - Sign out failed',
  })
  @SwaggerApiResponse({ status: 500, description: 'Internal server error' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard)
  async signOut() {
    const result = await this.authService.signOut();

    if (result.success) {
      return ApiResponse.success(null, result.message);
    } else {
      return ApiResponse.error(result.message, result.error);
    }
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user info' })
  @SwaggerApiResponse({ status: 200, description: 'User info retrieved' })
  @SwaggerApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid token',
  })
  @SwaggerApiResponse({ status: 500, description: 'Internal server error' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard)
  async getUser(@Req() request: Request) {
    return ApiResponse.success(
      request.user,
      'User information retrieved successfully.',
    );
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
  })
  @SwaggerApiResponse({ status: 400, description: 'Refresh failed' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    const result = await this.authService.refreshToken(
      refreshTokenDto.refreshToken,
    );

    if (result.success) {
      return ApiResponse.success(result.data, result.message);
    } else {
      return ApiResponse.error(result.message, result.error);
    }
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @SwaggerApiResponse({ status: 200, description: 'Profile retrieved' })
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard)
  async getProfile(@Req() request: Request) {
    const profile = await this.authService.getUserProfile(request.user.id);

    if (profile.success) {
      return ApiResponse.success(profile.data, profile.message);
    } else {
      return ApiResponse.error(profile.message);
    }
  }

  @Patch('role/:userId')
  @ApiOperation({ summary: 'Update user role (admin only)' })
  @SwaggerApiResponse({ status: 200, description: 'Role updated' })
  @SwaggerApiResponse({ status: 403, description: 'Forbidden' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateRole(
    @Param('userId') userId: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    const result = await this.authService.updateUserRole(
      userId,
      updateRoleDto.role,
    );

    if (result.success) {
      return ApiResponse.success(result.data, result.message);
    } else {
      return ApiResponse.error(result.message, result.error);
    }
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @SwaggerApiResponse({
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
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard)
  async updateProfile(
    @Req() request: Request,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const result = await this.authService.updateUserProfile(
      request.user.id,
      updateProfileDto,
    );

    if (result.success) {
      return ApiResponse.success(result.data, result.message);
    } else {
      return ApiResponse.error(result.message, result.error);
    }
  }
}
