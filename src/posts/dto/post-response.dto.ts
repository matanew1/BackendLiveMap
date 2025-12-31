// src/posts/dto/post-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class PostResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the post',
    example: 'post-123',
  })
  id: string;

  @ApiProperty({
    description: 'ID of the user who created the post',
    example: 'user-456',
  })
  userId: string;

  @ApiProperty({
    description: 'Display name of the user (dog name)',
    example: 'Buddy',
  })
  user: string;

  @ApiProperty({
    description: 'Breed of the dog',
    example: 'Golden Retriever',
  })
  breed: string;

  @ApiProperty({
    description: 'Age of the dog in years',
    example: 3,
  })
  age: number;

  @ApiProperty({
    description: 'Location associated with the post (latitude and longitude)',
    example: { lat: 40.7128, lng: -74.006 },
    nullable: true,
  })
  location: { lat: number; lng: number } | null;

  @ApiProperty({
    description: 'Content of the post',
    example: 'My dog had a great time at the park today!',
  })
  content: string;

  @ApiProperty({
    description: 'Human-readable time since creation',
    example: '2h ago',
  })
  time: string;

  @ApiProperty({
    description: 'Number of likes on the post',
    example: 42,
  })
  likes: number;

  @ApiProperty({
    description: 'URL of the post image',
    example: 'https://storage.example.com/posts/post-123.jpg',
    nullable: true,
  })
  imageUrl: string | null;

  @ApiProperty({
    description: 'ISO timestamp of creation',
    example: '2025-12-28T10:00:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'ISO timestamp of last update',
    example: '2025-12-28T10:00:00Z',
  })
  updatedAt: string;
}
