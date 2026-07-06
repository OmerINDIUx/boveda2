'use strict';
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d;
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return (c > 3 && r && Object.defineProperty(target, key, r), r);
  };
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v);
  };
var NotificationsScheduler_1;
Object.defineProperty(exports, '__esModule', { value: true });
exports.NotificationsScheduler = void 0;
const common_1 = require('@nestjs/common');
const notifications_service_1 = require('./notifications.service');
const HOUR_MS = 60 * 60 * 1000;
let NotificationsScheduler = (NotificationsScheduler_1 = class NotificationsScheduler {
  notifications;
  logger = new common_1.Logger(NotificationsScheduler_1.name);
  timer;
  constructor(notifications) {
    this.notifications = notifications;
  }
  onModuleInit() {
    this.runIfNeeded().catch((error) =>
      this.logger.error(error instanceof Error ? error.message : String(error))
    );
    this.timer = setInterval(() => {
      this.runIfNeeded().catch((error) =>
        this.logger.error(error instanceof Error ? error.message : String(error))
      );
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
  shouldRunToday() {
    const now = new Date();
    const key = now.toISOString().slice(0, 10);
    const globalState = globalThis;
    if (globalState.__holocronNotificationRunDate === key) {
      return false;
    }
    globalState.__holocronNotificationRunDate = key;
    return true;
  }
});
exports.NotificationsScheduler = NotificationsScheduler;
exports.NotificationsScheduler =
  NotificationsScheduler =
  NotificationsScheduler_1 =
    __decorate(
      [
        (0, common_1.Injectable)(),
        __metadata('design:paramtypes', [notifications_service_1.NotificationsService]),
      ],
      NotificationsScheduler
    );
//# sourceMappingURL=notifications.scheduler.js.map
