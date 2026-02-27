import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertChoiceDto {
  @ApiPropertyOptional({ description: 'Interested romantically (true = Yes, null = empty)' })
  @IsBoolean()
  @IsOptional()
  interestedRomantic?: boolean | null;

  @ApiPropertyOptional({ description: 'Interested as friends (true = Yes, null = empty)' })
  @IsBoolean()
  @IsOptional()
  interestedFriend?: boolean | null;

  @ApiPropertyOptional({ description: 'Not interested (true = Yes, null = empty)' })
  @IsBoolean()
  @IsOptional()
  notInterested?: boolean | null;
}
