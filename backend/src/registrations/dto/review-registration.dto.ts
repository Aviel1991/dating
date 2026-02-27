import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewRegistrationDto {
  @ApiPropertyOptional({ description: 'Admin note/reason' })
  @IsString()
  @IsOptional()
  adminNote?: string;
}
