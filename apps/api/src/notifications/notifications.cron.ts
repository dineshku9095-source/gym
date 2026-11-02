import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsCron {
  private readonly logger = new Logger(NotificationsCron.name);

  constructor(private readonly notifications: NotificationsService) {}

  // Default every 15 minutes (Nest schedule v4 has no EVERY_15_MINUTES enum)
  @Cron('0 */15 * * * *')
  async handle() {
    try {
      const result = await this.notifications.processReminders();
      this.logger.debug(`Reminder sweep: ${JSON.stringify(result)}`);
    } catch (e) {
      this.logger.error('Reminder sweep failed', e as Error);
    }
  }
}
