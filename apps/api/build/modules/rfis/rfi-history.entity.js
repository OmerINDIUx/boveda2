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
exports.RfiHistory = void 0;
const typeorm_1 = require('typeorm');
const user_entity_1 = require('../users/user.entity');
const rfi_entity_1 = require('./rfi.entity');
let RfiHistory = class RfiHistory {
  id;
  rfiId;
  rfi;
  actorId;
  actor;
  action;
  beforeState;
  afterState;
  createdAt;
};
exports.RfiHistory = RfiHistory;
__decorate(
  [(0, typeorm_1.PrimaryGeneratedColumn)('uuid'), __metadata('design:type', String)],
  RfiHistory.prototype,
  'id',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'rfi_id' }), __metadata('design:type', String)],
  RfiHistory.prototype,
  'rfiId',
  void 0
);
__decorate(
  [
    (0, typeorm_1.ManyToOne)(
      () => rfi_entity_1.Rfi,
      (rfi) => rfi.history
    ),
    (0, typeorm_1.JoinColumn)({ name: 'rfi_id' }),
    __metadata('design:type', rfi_entity_1.Rfi),
  ],
  RfiHistory.prototype,
  'rfi',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'actor_id', nullable: true }), __metadata('design:type', String)],
  RfiHistory.prototype,
  'actorId',
  void 0
);
__decorate(
  [
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'actor_id' }),
    __metadata('design:type', user_entity_1.User),
  ],
  RfiHistory.prototype,
  'actor',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ length: 80 }), __metadata('design:type', String)],
  RfiHistory.prototype,
  'action',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'before_state', type: 'json', nullable: true }),
    __metadata('design:type', Object),
  ],
  RfiHistory.prototype,
  'beforeState',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'after_state', type: 'json', nullable: true }),
    __metadata('design:type', Object),
  ],
  RfiHistory.prototype,
  'afterState',
  void 0
);
__decorate(
  [(0, typeorm_1.CreateDateColumn)({ name: 'created_at' }), __metadata('design:type', Date)],
  RfiHistory.prototype,
  'createdAt',
  void 0
);
exports.RfiHistory = RfiHistory = __decorate([(0, typeorm_1.Entity)('rfi_history')], RfiHistory);
//# sourceMappingURL=rfi-history.entity.js.map
