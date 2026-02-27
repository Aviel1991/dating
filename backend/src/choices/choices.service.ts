import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertChoiceDto } from './dto/upsert-choice.dto';
import { AttendanceStatus, EligibilityStatus } from '@prisma/client';

@Injectable()
export class ChoicesService {
  constructor(private prisma: PrismaService) {}

  async isSelectionOpen(eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const now = new Date();
    const isOpen =
      event.selectionOpenAt !== null &&
      now >= new Date(event.selectionOpenAt) &&
      (event.selectionCloseAt === null || now <= new Date(event.selectionCloseAt));

    return {
      isOpen,
      selectionOpenAt: event.selectionOpenAt,
      selectionCloseAt: event.selectionCloseAt,
    };
  }

  async getAvailableForSelection(eventId: string, userId: string) {
    return this.isSelectionOpen(eventId);
  }

  async getSelectionParticipants(eventId: string, userId: string) {
    // Verify the caller is arrived
    const myAttendance = await this.prisma.attendance.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });

    if (!myAttendance || myAttendance.status !== AttendanceStatus.arrived) {
      throw new ForbiddenException('You must have attended the event to view participants');
    }

    // Check selection window is open
    const { isOpen } = await this.isSelectionOpen(eventId);
    if (!isOpen) {
      throw new BadRequestException('Selection window is not open');
    }

    // Return all other arrived participants
    const attendances = await this.prisma.attendance.findMany({
      where: {
        eventId,
        status: AttendanceStatus.arrived,
        NOT: { userId },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            gender: true,
            profilePhotoUrl: true,
          },
        },
      },
    });

    // Get my existing choices for this event
    const myChoices = await this.prisma.choice.findMany({
      where: { eventId, fromUserId: userId },
    });

    const choicesMap = new Map(myChoices.map((c) => [c.toUserId, c]));

    return attendances.map((a) => ({
      userId: a.userId,
      displayName: a.user.fullName,
      photoUrl: a.user.profilePhotoUrl,
      gender: a.user.gender,
      choice: choicesMap.get(a.userId) || null,
    }));
  }

  async upsertChoice(
    eventId: string,
    fromUserId: string,
    toUserId: string,
    dto: UpsertChoiceDto,
  ) {
    if (fromUserId === toUserId) {
      throw new BadRequestException('Cannot choose yourself');
    }

    // Validate selection window
    const { isOpen } = await this.isSelectionOpen(eventId);
    if (!isOpen) {
      throw new BadRequestException('Selection window is not open');
    }

    // Validate caller is arrived
    const myAttendance = await this.prisma.attendance.findUnique({
      where: { eventId_userId: { eventId, userId: fromUserId } },
    });
    if (!myAttendance || myAttendance.status !== AttendanceStatus.arrived) {
      throw new ForbiddenException('You must have attended the event to make choices');
    }

    // Validate choice exclusivity
    this.validateChoiceExclusivity(dto);

    // Verify toUser is also arrived at this event
    const toAttendance = await this.prisma.attendance.findUnique({
      where: { eventId_userId: { eventId, userId: toUserId } },
    });
    if (!toAttendance || toAttendance.status !== AttendanceStatus.arrived) {
      throw new BadRequestException('Target participant has not attended this event');
    }

    const choice = await this.prisma.choice.upsert({
      where: {
        eventId_fromUserId_toUserId: { eventId, fromUserId, toUserId },
      },
      create: {
        eventId,
        fromUserId,
        toUserId,
        interestedRomantic: dto.interestedRomantic ?? null,
        interestedFriend: dto.interestedFriend ?? null,
        notInterested: dto.notInterested ?? null,
      },
      update: {
        interestedRomantic: dto.interestedRomantic ?? null,
        interestedFriend: dto.interestedFriend ?? null,
        notInterested: dto.notInterested ?? null,
      },
    });

    return choice;
  }

  async submitChoices(eventId: string, userId: string) {
    // Validate selection window
    const { isOpen } = await this.isSelectionOpen(eventId);
    if (!isOpen) {
      throw new BadRequestException('Selection window is not open');
    }

    // Mark all user's choices for this event as submitted
    await this.prisma.choice.updateMany({
      where: {
        eventId,
        fromUserId: userId,
        submittedAt: null,
      },
      data: { submittedAt: new Date() },
    });

    return { message: 'Choices submitted successfully' };
  }

  async openSelectionWindow(eventId: string, closeAt: string | null, adminId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data: {
        selectionOpenAt: new Date(),
        selectionCloseAt: closeAt ? new Date(closeAt) : null,
      },
    });

    return updated;
  }

  async closeSelectionWindow(eventId: string, adminId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data: { selectionCloseAt: new Date() },
    });

    return updated;
  }

  private validateChoiceExclusivity(dto: UpsertChoiceDto) {
    const trueCount = [dto.interestedRomantic, dto.interestedFriend, dto.notInterested].filter(
      (v) => v === true,
    ).length;

    if (trueCount > 1) {
      throw new BadRequestException(
        'At most one of interested_romantic, interested_friend, not_interested can be true',
      );
    }

    if (
      dto.notInterested === true &&
      (dto.interestedRomantic === true || dto.interestedFriend === true)
    ) {
      throw new BadRequestException(
        'not_interested cannot be true when interested_romantic or interested_friend is true',
      );
    }
  }
}
