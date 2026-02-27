import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsDateString,
  IsEnum,
  IsOptional,
  IsUrl,
  MinLength,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, RelationshipStatus } from '@prisma/client';

export class CreateRegistrationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '+972501234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Birth date (YYYY-MM-DD)' })
  @IsDateString()
  birthDate: string;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ enum: RelationshipStatus })
  @IsEnum(RelationshipStatus)
  relationshipStatus: RelationshipStatus;

  @ApiProperty({ description: 'Facebook profile URL' })
  @IsUrl()
  facebookUrl: string;

  @ApiPropertyOptional({ description: 'Instagram profile URL' })
  @IsUrl()
  @IsOptional()
  instagramUrl?: string;

  @ApiProperty({ description: 'About yourself (min 100 characters)', minLength: 100 })
  @IsString()
  @MinLength(100, { message: 'about_text must be at least 100 characters' })
  aboutText: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  lookingForText: string;

  @ApiProperty({ description: 'Consent to terms and privacy' })
  @IsBoolean()
  consentTerms: boolean;
}
