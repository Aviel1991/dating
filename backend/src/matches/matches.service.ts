import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MatchStatus, MatchType } from '@prisma/client';

@Injectable()
export class MatchesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
  ) {}

  async generateMatches(eventId: string, adminId: string) {
    // Get all submitted choices for arrived participants
    const choices = await this.prisma.choice.findMany({
      where: {
        eventId,
        submittedAt: { not: null },
      },
    });

    // Get arrived participants
    const arrivedAttendances = await this.prisma.attendance.findMany({
      where: { eventId, status: 'arrived' },
    });
    const arrivedUserIds = new Set(arrivedAttendances.map((a) => a.userId));

    // Build choices map: from_user_id -> to_user_id -> choice
    const choicesMap = new Map<string, Map<string, any>>();
    for (const choice of choices) {
      if (!arrivedUserIds.has(choice.fromUserId) || !arrivedUserIds.has(choice.toUserId)) {
        continue; // Skip non-arrived participants
      }
      if (!choicesMap.has(choice.fromUserId)) {
        choicesMap.set(choice.fromUserId, new Map());
      }
      choicesMap.get(choice.fromUserId).set(choice.toUserId, choice);
    }

    // Find mutual matches
    const processedPairs = new Set<string>();
    const newMatches: any[] = [];

    for (const [userAId, targets] of choicesMap) {
      for (const [userBId, choiceAB] of targets) {
        // Create canonical pair key to avoid duplicates
        const pairKey = [userAId, userBId].sort().join(':');
        if (processedPairs.has(pairKey)) continue;
        processedPairs.add(pairKey);

        const choiceBA = choicesMap.get(userBId)?.get(userAId);
        if (!choiceBA) continue;

        // Determine match type
        const romanticMatch =
          choiceAB.interestedRomantic === true && choiceBA.interestedRomantic === true;
        const friendMatch =
          choiceAB.interestedFriend === true && choiceBA.interestedFriend === true;

        if (!romanticMatch && !friendMatch) continue;

        let matchType: MatchType;
        if (romanticMatch && friendMatch) matchType = MatchType.both;
        else if (romanticMatch) matchType = MatchType.romantic;
        else matchType = MatchType.friend;

        newMatches.push({
          eventId,
          userAId,
          userBId,
          matchType,
        });
      }
    }

    // Idempotently insert matches (skip duplicates)
    let created = 0;
    let skipped = 0;

    for (const match of newMatches) {
      const [minId, maxId] = [match.userAId, match.userBId].sort();

      const existing = await this.prisma.match.findFirst({
        where: {
          eventId,
          OR: [
            { userAId: minId, userBId: maxId },
            { userAId: maxId, userBId: minId },
          ],
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await this.prisma.match.create({
        data: {
          eventId: match.eventId,
          userAId: minId,
          userBId: maxId,
          matchType: match.matchType,
          status: MatchStatus.pending_admin_approval,
        },
      });
      created++;
    }

    await this.auditService.log({
      adminId,
      action: 'GENERATE_MATCHES',
      entityType: 'event',
      entityId: eventId,
      eventId,
      meta: { created, skipped, total: newMatches.length },
    });

    return { created, skipped, total: newMatches.length };
  }

  async listForAdmin(eventId: string, status?: string) {
    const where: any = { eventId };
    if (status) where.status = status;

    return this.prisma.match.findMany({
      where,
      include: {
        userA: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            profilePhotoUrl: true,
            gender: true,
          },
        },
        userB: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            profilePhotoUrl: true,
            gender: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveMatch(matchId: string, adminId: string, note?: string) {
    const match = await this.findMatchById(matchId);

    if (match.status === MatchStatus.approved) {
      throw new BadRequestException('Match is already approved');
    }

    const updated = await this.prisma.match.update({
      where: { id: matchId },
      data: {
        status: MatchStatus.approved,
        reviewedAt: new Date(),
        reviewedByAdminId: adminId,
        reviewNote: note,
        notifiedAt: new Date(),
      },
      include: {
        userA: true,
        userB: true,
        event: true,
      },
    });

    await this.auditService.log({
      adminId,
      action: 'APPROVE_MATCH',
      entityType: 'match',
      entityId: matchId,
      eventId: match.eventId,
      meta: { matchType: match.matchType, userAId: match.userAId, userBId: match.userBId },
    });

    // Notify both participants
    await this.notificationsService.send('match_approved', updated.userA, updated.event, {
      matchId,
      matchType: match.matchType,
    });
    await this.notificationsService.send('match_approved', updated.userB, updated.event, {
      matchId,
      matchType: match.matchType,
    });

    return updated;
  }

  async rejectMatch(matchId: string, adminId: string, note?: string) {
    const match = await this.findMatchById(matchId);

    const updated = await this.prisma.match.update({
      where: { id: matchId },
      data: {
        status: MatchStatus.rejected,
        reviewedAt: new Date(),
        reviewedByAdminId: adminId,
        reviewNote: note,
      },
    });

    await this.auditService.log({
      adminId,
      action: 'REJECT_MATCH',
      entityType: 'match',
      entityId: matchId,
      eventId: match.eventId,
      meta: { reviewNote: note },
    });

    return updated;
  }

  async getMyMatches(eventId: string, userId: string) {
    const matches = await this.prisma.match.findMany({
      where: {
        eventId,
        status: MatchStatus.approved,
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: {
          select: {
            id: true,
            fullName: true,
            profilePhotoUrl: true,
            phone: true,
            instagramUrl: true,
          },
        },
        userB: {
          select: {
            id: true,
            fullName: true,
            profilePhotoUrl: true,
            phone: true,
            instagramUrl: true,
          },
        },
      },
    });

    // Return the other person's info
    return matches.map((match) => {
      const other = match.userAId === userId ? match.userB : match.userA;
      return {
        matchId: match.id,
        matchType: match.matchType,
        createdAt: match.createdAt,
        otherUser: {
          id: other.id,
          fullName: other.fullName,
          photoUrl: other.profilePhotoUrl,
          phone: other.phone,
          instagramUrl: other.instagramUrl,
        },
      };
    });
  }

  private async findMatchById(id: string) {
    const match = await this.prisma.match.findUnique({ where: { id } });
    if (!match) throw new NotFoundException('Match not found');
    return match;
  }
}
