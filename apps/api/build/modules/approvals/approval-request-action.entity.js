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
exports.ApprovalRequestAction = void 0;
const typeorm_1 = require('typeorm');
const user_entity_1 = require('../users/user.entity');
const approval_request_entity_1 = require('./approval-request.entity');
const approval_step_entity_1 = require('./approval-step.entity');
let ApprovalRequestAction = class ApprovalRequestAction {
  id;
  requestId;
  request;
  stepId;
  step;
  actorId;
  actor;
  action;
  comment;
  stepOrder;
  createdAt;
};
exports.ApprovalRequestAction = ApprovalRequestAction;
__decorate(
  [(0, typeorm_1.PrimaryGeneratedColumn)('uuid'), __metadata('design:type', String)],
  ApprovalRequestAction.prototype,
  'id',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'request_id' }), __metadata('design:type', String)],
  ApprovalRequestAction.prototype,
  'requestId',
  void 0
);
__decorate(
  [
    (0, typeorm_1.ManyToOne)(() => approval_request_entity_1.ApprovalRequest),
    (0, typeorm_1.JoinColumn)({ name: 'request_id' }),
    __metadata('design:type', approval_request_entity_1.ApprovalRequest),
  ],
  ApprovalRequestAction.prototype,
  'request',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'step_id', nullable: true }), __metadata('design:type', String)],
  ApprovalRequestAction.prototype,
  'stepId',
  void 0
);
__decorate(
  [
    (0, typeorm_1.ManyToOne)(() => approval_step_entity_1.ApprovalStep),
    (0, typeorm_1.JoinColumn)({ name: 'step_id' }),
    __metadata('design:type', approval_step_entity_1.ApprovalStep),
  ],
  ApprovalRequestAction.prototype,
  'step',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'actor_id' }), __metadata('design:type', String)],
  ApprovalRequestAction.prototype,
  'actorId',
  void 0
);
__decorate(
  [
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'actor_id' }),
    __metadata('design:type', user_entity_1.User),
  ],
  ApprovalRequestAction.prototype,
  'actor',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ length: 60 }), __metadata('design:type', String)],
  ApprovalRequestAction.prototype,
  'action',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ type: 'text', nullable: true }), __metadata('design:type', String)],
  ApprovalRequestAction.prototype,
  'comment',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'step_order', nullable: true }),
    __metadata('design:type', Number),
  ],
  ApprovalRequestAction.prototype,
  'stepOrder',
  void 0
);
__decorate(
  [(0, typeorm_1.CreateDateColumn)({ name: 'created_at' }), __metadata('design:type', Date)],
  ApprovalRequestAction.prototype,
  'createdAt',
  void 0
);
exports.ApprovalRequestAction = ApprovalRequestAction = __decorate(
  [(0, typeorm_1.Entity)('approval_request_actions')],
  ApprovalRequestAction
);
//# sourceMappingURL=approval-request-action.entity.js.map
