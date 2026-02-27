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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Reflector } from '@nestjs/core';

@ApiTags('Events')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EventsController {
  constructor(private eventsService: EventsService) {}

  // Public endpoints
  @Public()
  @Get('events/:eventId')
  @ApiOperation({ summary: 'Get public event details' })
  getPublicEvent(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.eventsService.findPublic(eventId);
  }

  @Public()
  @Get('events/:eventId/status')
  @ApiOperation({ summary: 'Get event registration status' })
  getEventStatus(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.eventsService.getEventStatus(eventId);
  }

  // Admin endpoints
  @Get('admin/events')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all admin events with stats' })
  getAdminEvents(@CurrentUser() user: any) {
    return this.eventsService.getAdminDashboard(user.id);
  }

  @Post('admin/events')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new event (draft)' })
  @ApiResponse({ status: 201, description: 'Event created' })
  createEvent(@Body() dto: CreateEventDto, @CurrentUser() user: any) {
    return this.eventsService.create(dto, user.id);
  }

  @Put('admin/events/:eventId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update event' })
  updateEvent(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: UpdateEventDto,
    @CurrentUser() user: any,
  ) {
    return this.eventsService.update(eventId, dto, user.id);
  }

  @Post('admin/events/:eventId/publish')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish event (requires cover image)' })
  @ApiResponse({ status: 400, description: 'Invalid cover image or missing required fields' })
  publishEvent(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser() user: any,
  ) {
    return this.eventsService.publish(eventId, user.id);
  }
}
