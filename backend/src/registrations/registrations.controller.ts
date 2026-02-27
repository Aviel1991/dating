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
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { ReviewRegistrationDto } from './dto/review-registration.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Registrations')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RegistrationsController {
  constructor(private registrationsService: RegistrationsService) {}

  @Public()
  @Post('events/:eventId/registrations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit registration for an event' })
  createRegistration(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: CreateRegistrationDto,
  ) {
    return this.registrationsService.create(eventId, dto);
  }

  @Get('me/events/:eventId/registration')
  @ApiOperation({ summary: 'Get my registration status for an event' })
  getMyRegistration(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentUser() user: any,
  ) {
    return this.registrationsService.getMyRegistration(eventId, user.id);
  }

  @Get('admin/events/:eventId/registrations')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List registrations for an event (admin)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'gender', required: false })
  listRegistrations(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Query('status') status?: string,
    @Query('gender') gender?: string,
  ) {
    return this.registrationsService.listForAdmin(eventId, { status, gender });
  }

  @Post('admin/registrations/:registrationId/approve')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a registration' })
  approveRegistration(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
    @Body() dto: ReviewRegistrationDto,
    @CurrentUser() user: any,
  ) {
    return this.registrationsService.approve(registrationId, dto, user.id);
  }

  @Post('admin/registrations/:registrationId/reject')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a registration' })
  rejectRegistration(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
    @Body() dto: ReviewRegistrationDto,
    @CurrentUser() user: any,
  ) {
    return this.registrationsService.reject(registrationId, dto, user.id);
  }

  @Post('admin/registrations/:registrationId/waitlist')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Waitlist a registration' })
  waitlistRegistration(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
    @Body() dto: ReviewRegistrationDto,
    @CurrentUser() user: any,
  ) {
    return this.registrationsService.waitlist(registrationId, dto, user.id);
  }
}
