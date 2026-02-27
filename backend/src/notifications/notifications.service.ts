import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type NotificationType =
  | 'registration_received'
  | 'approved_needs_photo'
  | 'approved_eligible'
  | 'selection_opened'
  | 'match_approved';

const TEMPLATES: Record<NotificationType, string> = {
  registration_received: 'הבקשה התקבלה וממתינה לאישור.',
  approved_needs_photo: 'אושרת! יש להעלות תמונה כדי להשתתף באירוע.',
  approved_eligible: "אושרת לאירוע. הצ'ק-אין יתבצע בכניסה.",
  selection_opened: 'חלון הבחירות נפתח. אפשר להתחיל לסמן.',
  match_approved: 'יש לכם מאצ׳ מאושר! פרטי קשר זמינים באפליקציה.',
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private configService: ConfigService) {}

  async send(
    type: NotificationType,
    user: { phone: string; email: string; fullName?: string },
    event?: any,
    meta?: Record<string, any>,
  ): Promise<void> {
    const message = TEMPLATES[type];
    if (!message) {
      this.logger.warn(`Unknown notification type: ${type}`);
      return;
    }

    const fullMessage = `[SpeedDating] ${message}${event ? ` (${event.title})` : ''}`;

    // Log notification (in production, send via SMS/Email provider)
    this.logger.log(
      `[NOTIFY] ${type} -> ${user.phone} (${user.email}): ${fullMessage}`,
    );

    // TODO: Integrate SMS provider (Twilio, etc.)
    // await this.smsProvider.send({ to: user.phone, body: fullMessage });

    // TODO: Integrate Email provider (SMTP, SendGrid, etc.)
    // await this.emailProvider.send({ to: user.email, subject: 'SpeedDating', body: fullMessage });
  }

  async sendBulk(
    type: NotificationType,
    users: Array<{ phone: string; email: string; fullName?: string }>,
    event?: any,
  ): Promise<void> {
    for (const user of users) {
      await this.send(type, user, event);
    }
  }
}
