import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { ReviewRegistrationDto } from './dto/review-registration.dto';
import { EligibilityStatus, EventStatus, RegistrationStatus } from '@prisma/client';

@Injectable()
export class RegistrationsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
  ) {}

  async create(eventId: string, dto: CreateRegistrationDto) {
    if (!dto.consentTerms) {
      throw new BadRequestException('Must accept terms and conditions');
    }

    // Verify event exists and is open for registration
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event || event.status !== EventStatus.published) {
      throw new NotFoundException('Event not found or not available');
    }

    const now = new Date();
    if (now < new Date(event.registrationOpenAt) || now > new Date(event.registrationCloseAt)) {
      throw new BadRequestException('Registration is not open for this event');
    }

    // Find or create user from phone/email
    let user = await this.prisma.user.findFirst({
      where: { OR: [{ phone: dto.phone }, { email: dto.email }] },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          fullName: dto.fullName,
          phone: dto.phone,
          email: dto.email,
          birthDate: new Date(dto.birthDate),
          gender: dto.gender,
          relationshipStatus: dto.relationshipStatus,
          facebookUrl: dto.facebookUrl,
          instagramUrl: dto.instagramUrl,
          aboutText: dto.aboutText,
          lookingForText: dto.lookingForText,
          consentFlags: { termsAccepted: true, termsAcceptedAt: now.toISOString() },
        },
      });
    } else {
      // Update user data
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          fullName: dto.fullName,
          birthDate: new Date(dto.birthDate),
          gender: dto.gender,
          relationshipStatus: dto.relationshipStatus,
          facebookUrl: dto.facebookUrl,
          instagramUrl: dto.instagramUrl,
          aboutText: dto.aboutText,
          lookingForText: dto.lookingForText,
        },
      });
    }

    // Check if already registered
    const existing = await this.prisma.registration.findUnique({
      where: { eventId_userId: { eventId, userId: user.id } },
    });

    if (existing) {
      if (existing.status === RegistrationStatus.cancelled) {
        // Re-activate
        const updated = await this.prisma.registration.update({
          where: { id: existing.id },
          data: { status: RegistrationStatus.pending, submittedAt: now },
        });
        await this.notificationsService.send('registration_received', user, event);
        return { registration: updated, user };
      }
      throw new ConflictException('already_registered: Already registered for this event');
    }

    const registration = await this.prisma.registration.create({
      data: {
        eventId,
        userId: user.id,
        status: RegistrationStatus.pending,
        submittedAt: now,
      },
    });

    await this.notificationsService.send('registration_received', user, event);

    return { registration, user };
  }

  async getMyRegistration(eventId: string, userId: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { eventId_userId: { eventId, userId } },
      include: { event: true },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    const participant = await this.prisma.eventParticipant.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });

    return {
      ...registration,
      eligibilityStatus: participant?.eligibilityStatus || null,
    };
  }

  async listForAdmin(eventId: string, filters: { status?: string; gender?: string }) {
    const where: any = { eventId };
    if (filters.status) where.status = filters.status;

    const registrations = await this.prisma.registration.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            birthDate: true,
            gender: true,
            profilePhotoUrl: true,
            phone: true,
            email: true,
            facebookUrl: true,
            instagramUrl: true,
            aboutText: true,
            lookingForText: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    if (filters.gender) {
      return registrations.filter((r) => r.user.gender === filters.gender);
    }

    return registrations;
  }

  async approve(registrationId: string, dto: ReviewRegistrationDto, adminId: string) {
    const registration = await this.findRegistrationById(registrationId);
    const user = await this.prisma.user.findUnique({ where: { id: registration.userId } });
    const event = await this.prisma.event.findUnique({ where: { id: registration.eventId } });

    if (registration.status === RegistrationStatus.approved) {
      throw new BadRequestException('Registration is already approved');
    }

    const hasPhoto = !!user.profilePhotoUrl;
    const eligibilityStatus = hasPhoto ? EligibilityStatus.eligible : EligibilityStatus.needs_photo;

    const [updatedReg] = await this.prisma.$transaction([
      this.prisma.registration.update({
        where: { id: registrationId },
        data: {
          status: RegistrationStatus.approved,
          approvedRequiresPhoto: !hasPhoto,
          adminNote: dto.adminNote,
          reviewedAt: new Date(),
          reviewedByAdminId: adminId,
        },
      }),
      this.prisma.eventParticipant.upsert({
        where: { eventId_userId: { eventId: registration.eventId, userId: registration.userId } },
        create: {
          eventId: registration.eventId,
          userId: registration.userId,
          displayName: user.fullName,
          displayPhotoUrl: user.profilePhotoUrl,
          gender: user.gender,
          eligibilityStatus,
        },
        update: {
          displayName: user.fullName,
          displayPhotoUrl: user.profilePhotoUrl,
          eligibilityStatus,
        },
      }),
      this.prisma.attendance.upsert({
        where: { eventId_userId: { eventId: registration.eventId, userId: registration.userId } },
        create: {
          eventId: registration.eventId,
          userId: registration.userId,
          status: 'not_arrived',
          method: 'manual',
        },
        update: {},
      }),
    ]);

    await this.auditService.log({
      adminId,
      action: 'APPROVE_REGISTRATION',
      entityType: 'registration',
      entityId: registrationId,
      eventId: registration.eventId,
      meta: { eligibilityStatus, hasPhoto },
    });

    const notifType = hasPhoto ? 'approved_eligible' : 'approved_needs_photo';
    await this.notificationsService.send(notifType, user, event);

    return updatedReg;
  }

  async reject(registrationId: string, dto: ReviewRegistrationDto, adminId: string) {
    const registration = await this.findRegistrationById(registrationId);

    const updated = await this.prisma.registration.update({
      where: { id: registrationId },
      data: {
        status: RegistrationStatus.rejected,
        adminNote: dto.adminNote,
        reviewedAt: new Date(),
        reviewedByAdminId: adminId,
      },
    });

    await this.auditService.log({
      adminId,
      action: 'REJECT_REGISTRATION',
      entityType: 'registration',
      entityId: registrationId,
      eventId: registration.eventId,
      meta: { adminNote: dto.adminNote },
    });

    return updated;
  }

  async waitlist(registrationId: string, dto: ReviewRegistrationDto, adminId: string) {
    const registration = await this.findRegistrationById(registrationId);

    const updated = await this.prisma.registration.update({
      where: { id: registrationId },
      data: {
        status: RegistrationStatus.waitlisted,
        adminNote: dto.adminNote,
        reviewedAt: new Date(),
        reviewedByAdminId: adminId,
      },
    });

    await this.auditService.log({
      adminId,
      action: 'WAITLIST_REGISTRATION',
      entityType: 'registration',
      entityId: registrationId,
      eventId: registration.eventId,
      meta: { adminNote: dto.adminNote },
    });

    return updated;
  }

  private async findRegistrationById(id: string) {
    const reg = await this.prisma.registration.findUnique({ where: { id } });
    if (!reg) throw new NotFoundException('Registration not found');
    return reg;
  }
}
