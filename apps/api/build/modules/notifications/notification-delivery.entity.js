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
Object.defineProperty(exports, '__esModule', { value: true });
exports.NotificationDelivery = void 0;
const typeorm_1 = require('typeorm');
let NotificationDelivery = class NotificationDelivery {
  id;
  userId;
  notificationType;
  channel;
  status;
  subject;
  entityType;
  entityId;
  dedupeKey;
  errorMessage;
  createdAt;
};
exports.NotificationDelivery = NotificationDelivery;
__decorate(
  [(0, typeorm_1.PrimaryGeneratedColumn)('uuid'), __metadata('design:type', String)],
  NotificationDelivery.prototype,
  'id',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'user_id' }), __metadata('design:type', String)],
  NotificationDelivery.prototype,
  'userId',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'notification_type', length: 80 }),
    __metadata('design:type', String),
  ],
  NotificationDelivery.prototype,
  'notificationType',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ length: 20 }), __metadata('design:type', String)],
  NotificationDelivery.prototype,
  'channel',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ length: 20, default: 'sent' }), __metadata('design:type', String)],
  NotificationDelivery.prototype,
  'status',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ length: 200, nullable: true }), __metadata('design:type', String)],
  NotificationDelivery.prototype,
  'subject',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'entity_type', nullable: true }),
    __metadata('design:type', String),
  ],
  NotificationDelivery.prototype,
  'entityType',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'entity_id', nullable: true }), __metadata('design:type', String)],
  NotificationDelivery.prototype,
  'entityId',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'dedupe_key', length: 190, nullable: true }),
    __metadata('design:type', String),
  ],
  NotificationDelivery.prototype,
  'dedupeKey',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'error_message', type: 'text', nullable: true }),
    __metadata('design:type', String),
  ],
  NotificationDelivery.prototype,
  'errorMessage',
  void 0
);
__decorate(
  [(0, typeorm_1.CreateDateColumn)({ name: 'created_at' }), __metadata('design:type', Date)],
  NotificationDelivery.prototype,
  'createdAt',
  void 0
);
exports.NotificationDelivery = NotificationDelivery = __decorate(
  [(0, typeorm_1.Entity)('notification_deliveries')],
  NotificationDelivery
);
//# sourceMappingURL=notification-delivery.entity.js.map
