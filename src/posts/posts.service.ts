// src/posts/posts.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Post } from './post.entity';
import { PostLike } from './post-like.entity';
import { User } from '../auth/user.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostResponseDto } from './dto/post-response.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(PostLike)
    private readonly postLikeRepo: Repository<PostLike>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toISOString().split('T')[0]; // Return date if older than a week
  }

  private async mapPostToResponse(post: Post): Promise<PostResponseDto> {
    const user = await this.userRepo.findOne({ where: { id: post.userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: post.id,
      userId: post.userId,
      user: user.dogName || 'Unknown',
      breed: user.dogBreed || '',
      age: user.dogAge || 0,
      location: post.location,
      content: post.content,
      time: this.formatTimeAgo(post.createdAt),
      likes: post.likesCount,
      imageUrl: post.imageUrl,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  }

  async getAllPosts(): Promise<PostResponseDto[]> {
    const posts = await this.postRepo.find({
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });

    return Promise.all(posts.map((post) => this.mapPostToResponse(post)));
  }

  async getPostsByUser(userId: string): Promise<PostResponseDto[]> {
    const posts = await this.postRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });

    return Promise.all(posts.map((post) => this.mapPostToResponse(post)));
  }

  async getPostById(id: string): Promise<PostResponseDto> {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.mapPostToResponse(post);
  }

  async createPost(
    userId: string,
    createPostDto: CreatePostDto,
  ): Promise<PostResponseDto> {
    const post = this.postRepo.create({
      id: uuidv4(),
      userId,
      content: createPostDto.content,
      location: createPostDto.location,
    });

    const savedPost = await this.postRepo.save(post);
    return this.mapPostToResponse(savedPost);
  }

  async updatePost(
    userId: string,
    postId: string,
    updatePostDto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    const post = await this.postRepo.findOne({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('You can only update your own posts');
    }

    if (updatePostDto.content !== undefined) {
      post.content = updatePostDto.content;
    }
    if (updatePostDto.location !== undefined) {
      post.location = updatePostDto.location;
    }

    const updatedPost = await this.postRepo.save(post);
    return this.mapPostToResponse(updatedPost);
  }

  async deletePost(userId: string, postId: string): Promise<void> {
    const post = await this.postRepo.findOne({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.postRepo.remove(post);
  }

  async toggleLike(userId: string, postId: string): Promise<{ likes: number }> {
    const post = await this.postRepo.findOne({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existingLike = await this.postLikeRepo.findOne({
      where: { postId, userId },
    });

    if (existingLike) {
      // Unlike: remove the like
      await this.postLikeRepo.remove(existingLike);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      // Like: add the like
      const like = this.postLikeRepo.create({
        id: uuidv4(),
        postId,
        userId,
      });
      await this.postLikeRepo.save(like);
      post.likesCount += 1;
    }

    await this.postRepo.save(post);
    return { likes: post.likesCount };
  }

  async updatePostImage(postId: string, imageUrl: string): Promise<void> {
    await this.postRepo.update(postId, { imageUrl });
  }
}
