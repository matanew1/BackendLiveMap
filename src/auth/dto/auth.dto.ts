import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsNumber,
} from 'class-validator';
import { UserRole } from '../user.entity';

export class SignUpDto {
  @ApiProperty({ example: 'matanew1@gmail.com', description: 'User email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'strongpassword123', description: 'User password' })
  @IsString()
  @MinLength(8)
  password: string;
}

export class SignInDto {
  @ApiProperty({ example: 'matanew1@gmail.com', description: 'User email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'strongpassword123', description: 'User password' })
  @IsString()
  @MinLength(8)
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ example: 'refresh_token_here', description: 'Refresh token' })
  @IsString()
  refreshToken: string;
}

export class UpdateRoleDto {
  @ApiProperty({ example: 'admin', enum: UserRole, description: 'User role' })
  @IsEnum(UserRole)
  role: UserRole;
}

export class UpdateProfileDto {
  @ApiProperty({ example: 'Buddy', description: 'Dog name', required: false })
  @IsString()
  @IsOptional()
  dogName?: string;

  @ApiProperty({
    example: 'Golden Retriever',
    description: 'Dog breed',
    required: false,
  })
  @IsString()
  @IsOptional()
  dogBreed?: string;

  @ApiProperty({ example: 3, description: 'Dog age', required: false })
  @IsNumber()
  @IsOptional()
  dogAge?: number;
}
