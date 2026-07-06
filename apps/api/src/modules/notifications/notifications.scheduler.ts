import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

const HOUR_MS = 60 * 60 * 1000;

@Injectable()
export class NotificationsScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsScheduler.name);
  private timer?: NodeJS.Timeout;

  constructor(private readonly notifications: NotificationsService) {}

  onModuleInit() {
    this.runIfNeeded().catch((error) => this.logger.error(error instanceof Error ? error.message : String(error)));
    this.timer = setInterval(() => {
      this.runIfNeeded().catch((error) => this.logger.error(error instanceof Error ? error.message : String(error)));
    }, HOUR_MS);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async runIfNeeded(force = false) {
    if (!force && !this.shouldRunToday()) {
      return { ok: true, skipped: true };
    }

    const result = await this.notifications.runDailyChecks();
    this.logger.log(`Jobs diarios de notificaciones ejecutados: ${JSON.stringify(result)}`);
    return result;
  }

  private shouldRunToday() {
    const now = new Date();
    const key = now.toISOString().slice(0, 10);
    const globalState = globalThis as typeof globalThis & { __holocronNotificationRunDate?: string };
    if (globalState.__holocronNotificationRunDate === key) {
      return false;
    }
    globalState.__holocronNotificationRunDate = key;
    return true;
  }
}
