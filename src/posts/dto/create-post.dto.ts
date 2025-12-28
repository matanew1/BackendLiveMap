// src/posts/dto/create-post.dto.ts
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({
    description: 'The content of the post',
    example: 'My dog had a great time at the park today!',
  })
  @IsString()
  content: string;

  @ApiProperty({
    description: 'Location where the post was made',
    example: 'Central Park, New York',
    required: false,
  })
  @IsOptional()
  @IsString()
  location?: string;
}
