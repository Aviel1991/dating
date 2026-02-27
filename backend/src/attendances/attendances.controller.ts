import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AttendancesService } from './attendances.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Attendances / Check-in')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AttendancesController {
  constructor(private attendancesService: AttendancesService) {}

  @Get('admin/events/:eventId/checkin-list')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get eligible participants for check-in' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or phone' })
  getCheckinList(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Query('search') search?: string,
  ) {
    return this.attendancesService.getCheckinList(eventId, search);
  }

  @Post('admin/events/:eventId/attendances/:userId/arrive')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark participant as arrived (check-in)' })
  markArrived(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() user: any,
  ) {
    return this.attendancesService.markArrived(eventId, userId, user.id);
  }
}
