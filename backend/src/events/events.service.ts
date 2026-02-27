import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventStatus } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(adminId?: string) {
    const where = adminId ? { createdByAdminId: adminId } : {};
    return this.prisma.event.findMany({
      where,
      orderBy: { startsAt: 'desc' },
    });
  }

  async findPublic(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || event.status === EventStatus.draft || event.status === EventStatus.cancelled) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async findById(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async getEventStatus(eventId: string) {
    const event = await this.findPublic(eventId);
    const now = new Date();
    const isRegistrationOpen =
      event.status === EventStatus.published &&
      now >= new Date(event.registrationOpenAt) &&
      now <= new Date(event.registrationCloseAt);

    return {
      eventId: event.id,
      status: event.status,
      isRegistrationOpen,
      registrationOpenAt: event.registrationOpenAt,
      registrationCloseAt: event.registrationCloseAt,
    };
  }

  async create(dto: CreateEventDto, adminId: string) {
    this.validateDates(dto);

    const event = await this.prisma.event.create({
      data: {
        title: dto.title,
        description: dto.description,
        coverImageUrl: dto.coverImageUrl || '',
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        locationName: dto.locationName,
        locationAddress: dto.locationAddress,
        capacityTotal: dto.capacityTotal,
        capacityMale: dto.capacityMale,
        capacityFemale: dto.capacityFemale,
        registrationOpenAt: new Date(dto.registrationOpenAt),
        registrationCloseAt: new Date(dto.registrationCloseAt),
        selectionOpenAt: dto.selectionOpenAt ? new Date(dto.selectionOpenAt) : null,
        selectionCloseAt: dto.selectionCloseAt ? new Date(dto.selectionCloseAt) : null,
        status: EventStatus.draft,
        createdByAdminId: adminId,
      },
    });

    await this.auditService.log({
      adminId,
      action: 'CREATE_EVENT',
      entityType: 'event',
      entityId: event.id,
      eventId: event.id,
      meta: { title: event.title },
    });

    return event;
  }

  async update(eventId: string, dto: UpdateEventDto, adminId: string) {
    const event = await this.findById(eventId);

    if (event.createdByAdminId !== adminId) {
      throw new ForbiddenException('You can only edit your own events');
    }

    if (event.status === EventStatus.cancelled) {
      throw new BadRequestException('Cannot edit a cancelled event');
    }

    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.coverImageUrl !== undefined) updateData.coverImageUrl = dto.coverImageUrl;
    if (dto.startsAt !== undefined) updateData.startsAt = new Date(dto.startsAt);
    if (dto.endsAt !== undefined) updateData.endsAt = new Date(dto.endsAt);
    if (dto.locationName !== undefined) updateData.locationName = dto.locationName;
    if (dto.locationAddress !== undefined) updateData.locationAddress = dto.locationAddress;
    if (dto.capacityTotal !== undefined) updateData.capacityTotal = dto.capacityTotal;
    if (dto.capacityMale !== undefined) updateData.capacityMale = dto.capacityMale;
    if (dto.capacityFemale !== undefined) updateData.capacityFemale = dto.capacityFemale;
    if (dto.registrationOpenAt !== undefined) updateData.registrationOpenAt = new Date(dto.registrationOpenAt);
    if (dto.registrationCloseAt !== undefined) updateData.registrationCloseAt = new Date(dto.registrationCloseAt);
    if (dto.selectionOpenAt !== undefined) updateData.selectionOpenAt = dto.selectionOpenAt ? new Date(dto.selectionOpenAt) : null;
    if (dto.selectionCloseAt !== undefined) updateData.selectionCloseAt = dto.selectionCloseAt ? new Date(dto.selectionCloseAt) : null;

    return this.prisma.event.update({
      where: { id: eventId },
      data: updateData,
    });
  }

  async publish(eventId: string, adminId: string) {
    const event = await this.findById(eventId);

    if (event.createdByAdminId !== adminId) {
      throw new ForbiddenException('You can only publish your own events');
    }

    if (event.status !== EventStatus.draft) {
      throw new BadRequestException('Only draft events can be published');
    }

    if (!event.coverImageUrl) {
      throw new BadRequestException('invalid_cover_image: Event must have a cover image before publishing');
    }

    const updated = await this.prisma.event.update({
      where: { id: eventId },
      data: { status: EventStatus.published },
    });

    await this.auditService.log({
      adminId,
      action: 'PUBLISH_EVENT',
      entityType: 'event',
      entityId: eventId,
      eventId,
      meta: { previousStatus: event.status },
    });

    return updated;
  }

  async getAdminDashboard(adminId: string) {
    const events = await this.prisma.event.findMany({
      where: { createdByAdminId: adminId },
      orderBy: { startsAt: 'desc' },
    });

    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const [pending, approved, needsPhoto, arrived] = await Promise.all([
          this.prisma.registration.count({ where: { eventId: event.id, status: 'pending' } }),
          this.prisma.registration.count({ where: { eventId: event.id, status: 'approved' } }),
          this.prisma.eventParticipant.count({ where: { eventId: event.id, eligibilityStatus: 'needs_photo' } }),
          this.prisma.attendance.count({ where: { eventId: event.id, status: 'arrived' } }),
        ]);

        return {
          ...event,
          stats: { pending, approved, needsPhoto, arrived },
        };
      }),
    );

    return eventsWithStats;
  }

  private validateDates(dto: CreateEventDto | UpdateEventDto) {
    if (dto.startsAt && dto.endsAt) {
      if (new Date(dto.endsAt) <= new Date(dto.startsAt)) {
        throw new BadRequestException('ends_at must be after starts_at');
      }
    }
    if (dto.registrationOpenAt && dto.registrationCloseAt) {
      if (new Date(dto.registrationCloseAt) <= new Date(dto.registrationOpenAt)) {
        throw new BadRequestException('registration_close_at must be after registration_open_at');
      }
    }
  }
}
