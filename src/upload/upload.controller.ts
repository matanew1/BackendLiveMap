import {
  Controller,
  Post,
  Body,
  Get,
  Headers,
  UseGuards,
  HttpStatus,
  Param,
  Patch,
  Req,
  UseInterceptors,
  UploadedFile,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiBearerAuth,
  ApiExtraModels,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';

declare module 'express' {
  interface Request {
    user?: any;
    authResult?: any;
  }
}
import { Token } from '../common/decorators/token.decorator';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { UploadService } from './upload.service';
import { User } from '../auth/user.entity';
import { ApiResponse } from '../common/dto/api-response.dto';

@ApiExtraModels(User) // To document User model in Swagger
@ApiTags('upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('avatar')
  @ApiOperation({
    summary: 'Upload user avatar',
    description:
      'Upload a new avatar image for the authenticated user. The image will be stored in Supabase Storage under users/{userId}/avatar.jpg and overwrite any existing avatar.',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'Avatar uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Avatar uploaded successfully.' },
        data: {
          type: 'object',
          properties: {
            avatarUrl: {
              type: 'string',
              example:
                'https://your-project.supabase.co/storage/v1/object/public/avatars/users/user123/avatar.jpg',
            },
          },
        },
      },
    },
  })
  @SwaggerApiResponse({
    status: 400,
    description: 'Bad request - invalid file or storage error',
  })
  @SwaggerApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Avatar image file (JPEG, PNG, etc.)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file to upload as avatar',
        },
      },
      required: ['file'],
    },
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard)
  @UseInterceptors(FileInterceptor('file')) // 'file' is the field name in the form-data
  async uploadAvatar(
    @Req() request: Request,
    @UploadedFile() file: Express.Multer.File,
    @Token() token: string,
  ) {
    const result = await this.uploadService.uploadAvatar(
      request.user.id,
      file,
      token,
    );

    if (result.success) {
      return ApiResponse.success(result.data, result.message);
    } else {
      return ApiResponse.error(result.message, result.error);
    }
  }

  @Patch('avatar')
  @ApiOperation({
    summary: 'Update user avatar',
    description:
      'Update the existing avatar image for the authenticated user. This will replace the current avatar with a new image.',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'Avatar updated successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Avatar updated successfully.' },
        data: {
          type: 'object',
          properties: {
            avatarUrl: {
              type: 'string',
              example:
                'https://your-project.supabase.co/storage/v1/object/public/avatars/users/user123/avatar.jpg',
            },
            previousAvatarUrl: {
              type: 'string',
              nullable: true,
              example:
                'https://your-project.supabase.co/storage/v1/object/public/avatars/users/user123/avatar.jpg',
            },
          },
        },
      },
    },
  })
  @SwaggerApiResponse({
    status: 400,
    description: 'Bad request - invalid file or storage error',
  })
  @SwaggerApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  @SwaggerApiResponse({ status: 404, description: 'User not found' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'New avatar image file (JPEG, PNG, etc.)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'New image file to replace current avatar',
        },
      },
      required: ['file'],
    },
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async updateAvatar(
    @Req() request: Request,
    @UploadedFile() file: Express.Multer.File,
    @Token() token: string,
  ) {
    const result = await this.uploadService.updateAvatar(
      request.user.id,
      file,
      token,
    );

    if (result.success) {
      return ApiResponse.success(result.data, result.message);
    } else {
      return ApiResponse.error(result.message, result.error);
    }
  }

  @Delete('avatar')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete user avatar',
    description:
      "Deletes the authenticated user's avatar from storage and database",
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'Avatar deleted successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Avatar deleted successfully.' },
        data: {
          type: 'object',
          properties: {
            previousAvatarUrl: { type: 'string', example: 'https://...' },
          },
        },
      },
    },
  })
  @SwaggerApiResponse({
    status: 400,
    description: 'Bad request - User not found or no avatar to delete',
  })
  @SwaggerApiResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerApiResponse({ status: 500, description: 'Internal server error' })
  async deleteAvatar(@Req() request: Request, @Token() token: string) {
    const result = await this.uploadService.deleteAvatar(
      request.user.id,
      token,
    );

    if (result.success) {
      return ApiResponse.success(result.data, result.message);
    } else {
      return ApiResponse.error(result.message, result.error);
    }
  }
}
