// src/posts/dto/create-post.dto.ts
import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class LocationDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}

export class CreatePostDto {
  @ApiProperty({
    description: 'The content of the post',
    example: 'My dog had a great time at the park today!',
  })
  @IsString()
  @MaxLength(500)
  content: string;

  @ApiProperty({
    description: 'Location where the post was made (latitude and longitude)',
    example: { lat: 40.7128, lng: -74.006 },
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;
}
