import { Module } from '@nestjs/common';
import { AttendancesController } from './attendances.controller';
import { AttendancesService } from './attendances.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [AttendancesController],
  providers: [AttendancesService],
  exports: [AttendancesService],
})
export class AttendancesModule {}
