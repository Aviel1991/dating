import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { ParticipantsModule } from './participants/participants.module';
import { AttendancesModule } from './attendances/attendances.module';
import { ChoicesModule } from './choices/choices.module';
import { MatchesModule } from './matches/matches.module';
import { StorageModule } from './storage/storage.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    EventsModule,
    RegistrationsModule,
    ParticipantsModule,
    AttendancesModule,
    ChoicesModule,
    MatchesModule,
    StorageModule,
    NotificationsModule,
    AuditModule,
  ],
})
export class AppModule {}
