import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateEventDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'ISO 8601 datetime' })
  @IsDateString()
  startsAt: string;

  @ApiProperty({ description: 'ISO 8601 datetime; must be after starts_at' })
  @IsDateString()
  endsAt: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  locationName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  locationAddress?: string;

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  capacityTotal: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(0)
  capacityMale?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(0)
  capacityFemale?: number;

  @ApiProperty()
  @IsDateString()
  registrationOpenAt: string;

  @ApiProperty()
  @IsDateString()
  registrationCloseAt: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  selectionOpenAt?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  selectionCloseAt?: string;

  // cover_image_url is set by the upload process, not directly in creation
  @ApiPropertyOptional({ description: 'URL of cover image (set after upload)' })
  @IsString()
  @IsOptional()
  coverImageUrl?: string;
}
