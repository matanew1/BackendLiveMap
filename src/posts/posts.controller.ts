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
  HttpStatus,
  HttpException,
} from '@nestjs/common';
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

import { PostsService } from './posts.service';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { LikeResponseDto } from './dto/like-response.dto';

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
  @ApiResponse({
    status: 200,
    description: 'Posts retrieved successfully',
    type: [PostResponseDto],
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard)
  async getAllPosts(): Promise<PostResponseDto[]> {
    return this.postsService.getAllPosts();
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get posts by user',
    description: 'Retrieve all posts by a specific user',
  })
  @ApiResponse({
    status: 200,
    description: 'Posts retrieved successfully',
    type: [PostResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard)
  async getPostsByUser(
    @Param('userId') userId: string,
  ): Promise<PostResponseDto[]> {
    return this.postsService.getPostsByUser(userId);
  }

  @Get(':postId')
  @ApiOperation({
    summary: 'Get single post',
    description: 'Retrieve a specific post by ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Post retrieved successfully',
    type: PostResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard)
  async getPostById(@Param('postId') postId: string): Promise<PostResponseDto> {
    return this.postsService.getPostById(postId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create new post',
    description: 'Create a new post for the authenticated user',
  })
  @ApiResponse({
    status: 201,
    description: 'Post created successfully',
    type: PostResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid data',
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard)
  async createPost(
    @Req() request: Request,
    @Body() createPostDto: CreatePostDto,
  ): Promise<PostResponseDto> {
    try {
      return await this.postsService.createPost(request.user.id, createPostDto);
    } catch (error) {
      throw new HttpException(
        {
          message: error.message || 'Failed to create post',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch(':postId')
  @ApiOperation({
    summary: 'Update post',
    description: 'Update an existing post (only by the post owner)',
  })
  @ApiResponse({
    status: 200,
    description: 'Post updated successfully',
    type: PostResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only update own posts',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard)
  async updatePost(
    @Req() request: Request,
    @Param('postId') postId: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    try {
      return await this.postsService.updatePost(
        request.user.id,
        postId,
        updatePostDto,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          message: error.message || 'Failed to update post',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':postId')
  @ApiOperation({
    summary: 'Delete post',
    description: 'Delete an existing post (only by the post owner)',
  })
  @ApiResponse({
    status: 204,
    description: 'Post deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only delete own posts',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard)
  async deletePost(
    @Req() request: Request,
    @Param('postId') postId: string,
  ): Promise<void> {
    try {
      await this.postsService.deletePost(request.user.id, postId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          message: error.message || 'Failed to delete post',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post(':postId/like')
  @ApiOperation({
    summary: 'Toggle like on post',
    description:
      'Like or unlike a post. If user already liked, it will unlike; otherwise it will like.',
  })
  @ApiResponse({
    status: 200,
    description: 'Like toggled successfully',
    type: LikeResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(SupabaseAuthGuard)
  async toggleLike(
    @Req() request: Request,
    @Param('postId') postId: string,
  ): Promise<LikeResponseDto> {
    try {
      return await this.postsService.toggleLike(request.user.id, postId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          message: error.message || 'Failed to toggle like',
          statusCode: HttpStatus.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
