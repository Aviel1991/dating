import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { StorageService } from '../storage/storage.service';
import { EligibilityStatus } from '@prisma/client';

@Injectable()
export class ParticipantsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
    private storageService: StorageService,
  ) {}

  async listParticipants(eventId: string, eligibility?: string) {
    const where: any = { eventId };
    if (eligibility) where.eligibilityStatus = eligibility;

    return this.prisma.eventParticipant.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            birthDate: true,
            gender: true,
            profilePhotoUrl: true,
            instagramUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getPresignedUploadUrl(userId: string) {
    const { uploadUrl, fileKey } = await this.storageService.getPresignedUploadUrl(
      `profile-photos/${userId}`,
    );

    return { uploadUrl, fileKey };
  }

  async confirmPhotoUpload(userId: string, fileKey: string) {
    const photoUrl = this.storageService.getPublicUrl(fileKey);

    // Update user profile photo
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { profilePhotoUrl: photoUrl },
    });

    // Update all event participants for this user to eligible
    await this.prisma.eventParticipant.updateMany({
      where: {
        userId,
        eligibilityStatus: EligibilityStatus.needs_photo,
      },
      data: {
        displayPhotoUrl: photoUrl,
        eligibilityStatus: EligibilityStatus.eligible,
      },
    });

    await this.auditService.log({
      adminId: userId,
      action: 'UPLOAD_PHOTO_CONFIRM',
      entityType: 'user',
      entityId: userId,
      meta: { fileKey },
    });

    return { profilePhotoUrl: photoUrl };
  }

  async remindNeedsPhoto(eventId: string, adminId: string) {
    const needsPhotoParticipants = await this.prisma.eventParticipant.findMany({
      where: { eventId, eligibilityStatus: EligibilityStatus.needs_photo },
      include: { user: true },
    });

    const event = await this.prisma.event.findUnique({ where: { id: eventId } });

    let count = 0;
    for (const participant of needsPhotoParticipants) {
      await this.notificationsService.send('approved_needs_photo', participant.user, event);
      count++;
    }

    await this.auditService.log({
      adminId,
      action: 'SEND_PHOTO_REMINDER',
      entityType: 'event',
      entityId: eventId,
      eventId,
      meta: { reminderCount: count },
    });

    return { reminded: count };
  }

  async exportCsv(eventId: string) {
    const participants = await this.listParticipants(eventId);

    const headers = ['Name', 'Email', 'Phone', 'Gender', 'Eligibility', 'Photo'];
    const rows = participants.map((p) => [
      p.displayName,
      p.user.email,
      p.user.phone,
      p.gender,
      p.eligibilityStatus,
      p.displayPhotoUrl ? 'Yes' : 'No',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell || ''}"`).join(','))
      .join('\n');

    return csv;
  }
}
