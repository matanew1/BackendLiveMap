// src/posts/dto/update-post.dto.ts
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

export class UpdatePostDto {
  @ApiProperty({
    description: 'The updated content of the post',
    example: 'My dog had an amazing time at the park today!',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  content?: string;

  @ApiProperty({
    description: 'Updated location (latitude and longitude)',
    example: { lat: 40.7128, lng: -74.006 },
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;
}
