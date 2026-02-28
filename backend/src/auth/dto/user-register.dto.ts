import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserRegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'mypassword', minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'הסיסמא חייבת להכיל לפחות 6 תווים' })
  password: string;

  @ApiProperty({ example: 'ישראל ישראלי' })
  @IsString()
  @IsNotEmpty()
  fullName: string;
}
