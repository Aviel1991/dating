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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class ReviewMatchDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  note?: string;
}

@ApiTags('Matches')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MatchesController {
  constructor(private matchesService: MatchesService) {}

  // Admin routes
  @Post('admin/events/:eventId/matches/generate')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate matches from mutual choices (idempotent)' })
  generateMatches(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser() user: any,
  ) {
    return this.matchesService.generateMatches(eventId, user.id);
  }

  @Get('admin/events/:eventId/matches')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List matches for an event (optionally filter by status)' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending_admin_approval', 'approved', 'rejected'] })
  listMatches(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Query('status') status?: string,
  ) {
    return this.matchesService.listForAdmin(eventId, status);
  }

  @Post('admin/matches/:matchId/approve')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a match and notify participants' })
  approveMatch(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Body() dto: ReviewMatchDto,
    @CurrentUser() user: any,
  ) {
    return this.matchesService.approveMatch(matchId, user.id, dto.note);
  }

  @Post('admin/matches/:matchId/reject')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a match' })
  rejectMatch(
    @Param('matchId', ParseUUIDPipe) matchId: string,
    @Body() dto: ReviewMatchDto,
    @CurrentUser() user: any,
  ) {
    return this.matchesService.rejectMatch(matchId, user.id, dto.note);
  }

  // Participant routes
  @Get('me/events/:eventId/matches')
  @ApiOperation({ summary: 'Get my approved matches with contact details' })
  getMyMatches(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser() user: any,
  ) {
    return this.matchesService.getMyMatches(eventId, user.id);
  }
}
