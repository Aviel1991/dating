import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface AuditLogEntry {
  adminId: string;
  action: string;
  entityType: string;
  entityId: string;
  eventId?: string;
  meta?: Record<string, any>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.adminAuditLog.create({
        data: {
          adminId: entry.adminId,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          eventId: entry.eventId || null,
          metaJson: entry.meta || {},
        },
      });
    } catch (error) {
      this.logger.error(`Failed to write audit log: ${error.message}`, {
        entry,
        error: error.message,
      });
    }
  }

  async getLogs(filters: { eventId?: string; adminId?: string; action?: string }) {
    const where: any = {};
    if (filters.eventId) where.eventId = filters.eventId;
    if (filters.adminId) where.adminId = filters.adminId;
    if (filters.action) where.action = filters.action;

    return this.prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }
}
