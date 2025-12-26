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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiProperty,
} from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { AuthService } from './auth.service';
import { SupabaseAuthGuard } from './auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from './user.entity';

class SignUpDto {
  @ApiProperty({ example: 'matanew1@gmail.com', description: 'User email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'strongpassword123', description: 'User password' })
  @IsString()
  @MinLength(8)
  password: string;
}

class SignInDto {
  @ApiProperty({ example: 'matanew1@gmail.com', description: 'User email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'strongpassword123', description: 'User password' })
  @IsString()
  @MinLength(8)
  password: string;
}

class RefreshTokenDto {
  @ApiProperty({ example: 'refresh_token_here', description: 'Refresh token' })
  @IsString()
  refreshToken: string;
}

class UpdateRoleDto {
  @ApiProperty({ example: 'admin', enum: UserRole, description: 'User role' })
  @IsEnum(UserRole)
  role: UserRole;
}

class UpdateProfileDto {
  @ApiProperty({ example: 'Buddy', description: 'Dog name', required: false })
  @IsString()
  @IsOptional()
  dogName?: string;

  @ApiProperty({
    example: 'Golden Retriever',
    description: 'Dog breed',
    required: false,
  })
  @IsString()
  @IsOptional()
  dogBreed?: string;

  @ApiProperty({ example: 3, description: 'Dog age', required: false })
  @IsNumber()
  @IsOptional()
  dogAge?: number;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
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
  @ApiBearerAuth()
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
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  async getUser(@Headers('authorization') authHeader: string) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const result = await this.authService.getUser(token);

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
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  async getProfile(@Headers('authorization') authHeader: string) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const userResult = await this.authService.getUser(token);
      if (!userResult.success || !userResult.data?.user) {
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }
      const profile = await this.authService.getUserProfile(
        userResult.data.user.id,
      );

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
  @ApiBearerAuth()
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
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  async updateProfile(
    @Headers('authorization') authHeader: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const userResult = await this.authService.getUser(token);
      if (!userResult.success || !userResult.data?.user) {
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }
      const result = await this.authService.updateUserProfile(
        userResult.data.user.id,
        updateProfileDto,
      );

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
          message: 'An unexpected error occurred while updating profile.',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
