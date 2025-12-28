// src/posts/dto/update-post.dto.ts
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePostDto {
  @ApiProperty({
    description: 'The updated content of the post',
    example: 'My dog had an amazing time at the park today!',
    required: false,
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({
    description: 'Updated location',
    example: 'Central Park, New York',
    required: false,
  })
  @IsOptional()
  @IsString()
  location?: string;
}
