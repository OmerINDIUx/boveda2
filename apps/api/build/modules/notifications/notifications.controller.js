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
var __param =
  (this && this.__param) ||
  function (paramIndex, decorator) {
    return function (target, key) {
      decorator(target, key, paramIndex);
    };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.NotificationsController = void 0;
const common_1 = require('@nestjs/common');
const swagger_1 = require('@nestjs/swagger');
const current_user_decorator_1 = require('../../common/decorators/current-user.decorator');
const active_user_guard_1 = require('../../common/guards/active-user.guard');
const jwt_auth_guard_1 = require('../../common/guards/jwt-auth.guard');
const update_notification_preferences_dto_1 = require('./dto/update-notification-preferences.dto');
const notifications_scheduler_1 = require('./notifications.scheduler');
const notifications_service_1 = require('./notifications.service');
let NotificationsController = class NotificationsController {
  notifications;
  scheduler;
  constructor(notifications, scheduler) {
    this.notifications = notifications;
    this.scheduler = scheduler;
  }
  list(user) {
    return this.notifications.listForUser(user.id);
  }
  unreadCount(user) {
    return this.notifications.unreadCount(user.id);
  }
  markAsRead(user, id) {
    return this.notifications.markAsRead(user.id, id);
  }
  markAllAsRead(user) {
    return this.notifications.markAllAsRead(user.id);
  }
  preferences(user) {
    return this.notifications.listPreferences(user.id);
  }
  updatePreferences(user, dto) {
    return this.notifications.updatePreferences(user.id, dto.items);
  }
  runJobs() {
    return this.scheduler.runIfNeeded(true);
  }
};
exports.NotificationsController = NotificationsController;
__decorate(
  [
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', [Object]),
    __metadata('design:returntype', void 0),
  ],
  NotificationsController.prototype,
  'list',
  null
);
__decorate(
  [
    (0, common_1.Get)('unread-count'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', [Object]),
    __metadata('design:returntype', void 0),
  ],
  NotificationsController.prototype,
  'unreadCount',
  null
);
__decorate(
  [
    (0, common_1.Patch)(':id/read'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', [Object, String]),
    __metadata('design:returntype', void 0),
  ],
  NotificationsController.prototype,
  'markAsRead',
  null
);
__decorate(
  [
    (0, common_1.Patch)('read-all'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', [Object]),
    __metadata('design:returntype', void 0),
  ],
  NotificationsController.prototype,
  'markAllAsRead',
  null
);
__decorate(
  [
    (0, common_1.Get)('preferences'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', [Object]),
    __metadata('design:returntype', void 0),
  ],
  NotificationsController.prototype,
  'preferences',
  null
);
__decorate(
  [
    (0, common_1.Post)('preferences'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', [
      Object,
      update_notification_preferences_dto_1.UpdateNotificationPreferencesDto,
    ]),
    __metadata('design:returntype', void 0),
  ],
  NotificationsController.prototype,
  'updatePreferences',
  null
);
__decorate(
  [
    (0, common_1.Post)('jobs/run'),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', []),
    __metadata('design:returntype', void 0),
  ],
  NotificationsController.prototype,
  'runJobs',
  null
);
exports.NotificationsController = NotificationsController = __decorate(
  [
    (0, swagger_1.ApiTags)('notifications'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, active_user_guard_1.ActiveUserGuard),
    (0, common_1.Controller)('notifications'),
    __metadata('design:paramtypes', [
      notifications_service_1.NotificationsService,
      notifications_scheduler_1.NotificationsScheduler,
    ]),
  ],
  NotificationsController
);
//# sourceMappingURL=notifications.controller.js.map
