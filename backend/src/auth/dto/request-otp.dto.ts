import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestOtpDto {
  @ApiProperty({ example: '+972501234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}
