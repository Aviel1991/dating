import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  IsOptional,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChoicesService } from './choices.service';
import { UpsertChoiceDto } from './dto/upsert-choice.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IsDateString, IsOptional as IsOptionalClass, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class OpenSelectionDto {
  @ApiPropertyOptional()
  @IsDateString()
  @IsOptionalClass()
  closeAt?: string;
}

@ApiTags('Choices & Selection Window')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ChoicesController {
  constructor(private choicesService: ChoicesService) {}

  // Admin: Selection window control
  @Post('admin/events/:eventId/selection/open')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Open selection window for an event' })
  openSelection(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: OpenSelectionDto,
    @CurrentUser() user: any,
  ) {
    return this.choicesService.openSelectionWindow(eventId, dto.closeAt || null, user.id);
  }

  @Post('admin/events/:eventId/selection/close')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close selection window for an event' })
  closeSelection(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser() user: any,
  ) {
    return this.choicesService.closeSelectionWindow(eventId, user.id);
  }

  // Participant: Selection availability
  @Get('me/events/:eventId/selection/available')
  @ApiOperation({ summary: 'Check if selection window is open for me' })
  getSelectionAvailable(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser() user: any,
  ) {
    return this.choicesService.getAvailableForSelection(eventId, user.id);
  }

  @Get('me/events/:eventId/selection/participants')
  @ApiOperation({ summary: 'List arrived participants for making selections' })
  getSelectionParticipants(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser() user: any,
  ) {
    return this.choicesService.getSelectionParticipants(eventId, user.id);
  }

  // Choices
  @Put('me/events/:eventId/choices/:toUserId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upsert choice for a participant (mutual exclusivity enforced)' })
  upsertChoice(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('toUserId', ParseUUIDPipe) toUserId: string,
    @Body() dto: UpsertChoiceDto,
    @CurrentUser() user: any,
  ) {
    return this.choicesService.upsertChoice(eventId, user.id, toUserId, dto);
  }

  @Post('me/events/:eventId/choices/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit/lock all choices for an event' })
  submitChoices(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser() user: any,
  ) {
    return this.choicesService.submitChoices(eventId, user.id);
  }
}
