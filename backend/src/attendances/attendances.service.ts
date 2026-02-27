import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AttendanceStatus, EligibilityStatus } from '@prisma/client';

@Injectable()
export class AttendancesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async getCheckinList(eventId: string, search?: string) {
    const participants = await this.prisma.eventParticipant.findMany({
      where: {
        eventId,
        eligibilityStatus: EligibilityStatus.eligible,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            gender: true,
            profilePhotoUrl: true,
          },
        },
      },
      orderBy: { displayName: 'asc' },
    });

    // Get attendance records
    const attendances = await this.prisma.attendance.findMany({
      where: { eventId },
    });

    const attendanceMap = new Map(attendances.map((a) => [a.userId, a]));

    const result = participants.map((p) => ({
      ...p,
      attendance: attendanceMap.get(p.userId) || null,
    }));

    if (search) {
      const q = search.toLowerCase();
      return result.filter(
        (p) =>
          p.displayName.toLowerCase().includes(q) ||
          p.user.phone.includes(q),
      );
    }

    return result;
  }

  async markArrived(eventId: string, userId: string, adminId: string) {
    // Verify participant is eligible
    const participant = await this.prisma.eventParticipant.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found for this event');
    }

    if (participant.eligibilityStatus !== EligibilityStatus.eligible) {
      throw new BadRequestException(
        `needs_photo: Participant must have a photo to check in. Current status: ${participant.eligibilityStatus}`,
      );
    }

    const attendance = await this.prisma.attendance.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: {
        eventId,
        userId,
        status: AttendanceStatus.arrived,
        checkinTime: new Date(),
        checkedInByAdminId: adminId,
        method: 'manual',
      },
      update: {
        status: AttendanceStatus.arrived,
        checkinTime: new Date(),
        checkedInByAdminId: adminId,
      },
    });

    await this.auditService.log({
      adminId,
      action: 'CHECKIN_ARRIVE',
      entityType: 'attendance',
      entityId: attendance.id,
      eventId,
      meta: { userId },
    });

    return attendance;
  }
}
