// src/posts/dto/create-post.dto.ts
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({
    description: 'The content of the post',
    example: 'My dog had a great time at the park today!',
  })
  @IsString()
  content: string;

  @ApiProperty({
    description: 'Location where the post was made (latitude and longitude)',
    example: { lat: 40.7128, lng: -74.006 },
    required: false,
  })
  @IsOptional()
  location?: { lat: number; lng: number };
}
