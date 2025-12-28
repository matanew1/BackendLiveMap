// src/posts/dto/like-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class LikeResponseDto {
  @ApiProperty({
    description: 'Updated number of likes on the post',
    example: 43,
  })
  likes: number;
}
