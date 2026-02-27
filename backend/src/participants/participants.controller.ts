import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ParticipantsService } from './participants.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class ConfirmPhotoDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fileKey: string;
}

@ApiTags('Participants')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ParticipantsController {
  constructor(private participantsService: ParticipantsService) {}

  // Admin routes
  @Get('admin/events/:eventId/participants')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List participants by eligibility' })
  @ApiQuery({ name: 'eligibility', required: false, enum: ['eligible', 'needs_photo', 'disabled'] })
  listParticipants(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Query('eligibility') eligibility?: string,
  ) {
    return this.participantsService.listParticipants(eventId, eligibility);
  }

  @Post('admin/events/:eventId/participants/remind-photo')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send photo upload reminder to needs_photo participants' })
  remindPhoto(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser() user: any,
  ) {
    return this.participantsService.remindNeedsPhoto(eventId, user.id);
  }

  @Get('admin/events/:eventId/participants/export.csv')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Export participants as CSV' })
  async exportCsv(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Res() res: Response,
  ) {
    const csv = await this.participantsService.exportCsv(eventId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="participants-${eventId}.csv"`);
    res.send(csv);
  }

  // Participant routes
  @Post('me/profile-photo/upload-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get presigned URL for profile photo upload' })
  getUploadUrl(@CurrentUser() user: any) {
    return this.participantsService.getPresignedUploadUrl(user.id);
  }

  @Post('me/profile-photo/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm profile photo upload and update eligibility' })
  confirmUpload(@Body() dto: ConfirmPhotoDto, @CurrentUser() user: any) {
    return this.participantsService.confirmPhotoUpload(user.id, dto.fileKey);
  }
}
