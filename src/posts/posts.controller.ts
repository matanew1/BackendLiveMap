// src/posts/posts.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
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

import { PostsService } from './posts.service';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { LikeResponseDto } from './dto/like-response.dto';
import { ApiResponse } from '../common/dto/api-response.dto';

@ApiExtraModels(PostResponseDto, LikeResponseDto)
@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all posts (feed)',
    description: 'Retrieve all posts in reverse chronological order',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'Posts retrieved successfully',
    type: [PostResponseDto],
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard)
  async getAllPosts(): Promise<ApiResponse<PostResponseDto[]>> {
    const posts = await this.postsService.getAllPosts();
    return ApiResponse.success(posts, 'Posts retrieved successfully');
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get posts by user',
    description: 'Retrieve all posts by a specific user',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'Posts retrieved successfully',
    type: [PostResponseDto],
  })
  @SwaggerApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard)
  async getPostsByUser(
    @Param('userId') userId: string,
  ): Promise<ApiResponse<PostResponseDto[]>> {
    const posts = await this.postsService.getPostsByUser(userId);
    return ApiResponse.success(posts, 'Posts retrieved successfully');
  }

  @Get(':postId')
  @ApiOperation({
    summary: 'Get single post',
    description: 'Retrieve a specific post by ID',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'Post retrieved successfully',
    type: PostResponseDto,
  })
  @SwaggerApiResponse({
    status: 404,
    description: 'Post not found',
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard)
  async getPostById(
    @Param('postId') postId: string,
  ): Promise<ApiResponse<PostResponseDto>> {
    const post = await this.postsService.getPostById(postId);
    return ApiResponse.success(post, 'Post retrieved successfully');
  }

  @Post()
  @ApiOperation({
    summary: 'Create new post',
    description: 'Create a new post for the authenticated user',
  })
  @SwaggerApiResponse({
    status: 201,
    description: 'Post created successfully',
    type: PostResponseDto,
  })
  @SwaggerApiResponse({
    status: 400,
    description: 'Bad request - invalid data',
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard)
  async createPost(
    @Req() request: Request,
    @Body() createPostDto: CreatePostDto,
  ): Promise<ApiResponse<PostResponseDto>> {
    const post = await this.postsService.createPost(
      request.user.id,
      createPostDto,
    );
    return ApiResponse.success(post, 'Post created successfully');
  }

  @Patch(':postId')
  @ApiOperation({
    summary: 'Update post',
    description: 'Update an existing post (only by the post owner)',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'Post updated successfully',
    type: PostResponseDto,
  })
  @SwaggerApiResponse({
    status: 403,
    description: 'Forbidden - can only update own posts',
  })
  @SwaggerApiResponse({
    status: 404,
    description: 'Post not found',
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard)
  async updatePost(
    @Req() request: Request,
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<ApiResponse<PostResponseDto>> {
    const post = await this.postsService.updatePost(
      request.user.id,
      postId,
      updatePostDto,
    );
    return ApiResponse.success(post, 'Post updated successfully');
  }

  @Delete(':postId')
  @ApiOperation({
    summary: 'Delete post',
    description: 'Delete an existing post (only by the post owner)',
  })
  @SwaggerApiResponse({
    status: 204,
    description: 'Post deleted successfully',
  })
  @SwaggerApiResponse({
    status: 403,
    description: 'Forbidden - can only delete own posts',
  })
  @SwaggerApiResponse({
    status: 404,
    description: 'Post not found',
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard)
  async deletePost(
    @Req() request: Request,
    @Param('postId') postId: string,
  ): Promise<ApiResponse<null>> {
    await this.postsService.deletePost(request.user.id, postId);
    return ApiResponse.success(null, 'Post deleted successfully');
  }

  @Post(':postId/like')
  @ApiOperation({
    summary: 'Toggle like on post',
    description:
      'Like or unlike a post. If user already liked, it will unlike; otherwise it will like.',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'Like toggled successfully',
    type: LikeResponseDto,
  })
  @SwaggerApiResponse({
    status: 404,
    description: 'Post not found',
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard)
  async toggleLike(
    @Req() request: Request,
    @Param('postId') postId: string,
  ): Promise<ApiResponse<LikeResponseDto>> {
    const likeResponse = await this.postsService.toggleLike(
      request.user.id,
      postId,
    );
    return ApiResponse.success(likeResponse, 'Like toggled successfully');
  }
}
