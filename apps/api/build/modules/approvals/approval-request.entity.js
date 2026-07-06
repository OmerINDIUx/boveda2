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
exports.ApprovalRequest = void 0;
const typeorm_1 = require('typeorm');
let ApprovalRequest = class ApprovalRequest {
  id;
  workflowId;
  currentStepId;
  requesterId;
  projectId;
  entityType;
  entityId;
  status;
  requestedAt;
  lastActionAt;
  completedAt;
  createdAt;
  updatedAt;
  deletedAt;
};
exports.ApprovalRequest = ApprovalRequest;
__decorate(
  [(0, typeorm_1.PrimaryGeneratedColumn)('uuid'), __metadata('design:type', String)],
  ApprovalRequest.prototype,
  'id',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'workflow_id' }), __metadata('design:type', String)],
  ApprovalRequest.prototype,
  'workflowId',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'current_step_id', nullable: true }),
    __metadata('design:type', String),
  ],
  ApprovalRequest.prototype,
  'currentStepId',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'requester_id' }), __metadata('design:type', String)],
  ApprovalRequest.prototype,
  'requesterId',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'project_id' }), __metadata('design:type', String)],
  ApprovalRequest.prototype,
  'projectId',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'entity_type', length: 80 }), __metadata('design:type', String)],
  ApprovalRequest.prototype,
  'entityType',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'entity_id' }), __metadata('design:type', String)],
  ApprovalRequest.prototype,
  'entityId',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ default: 'pending' }), __metadata('design:type', String)],
  ApprovalRequest.prototype,
  'status',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'requested_at', type: 'datetime' }),
    __metadata('design:type', Date),
  ],
  ApprovalRequest.prototype,
  'requestedAt',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'last_action_at', type: 'datetime', nullable: true }),
    __metadata('design:type', Date),
  ],
  ApprovalRequest.prototype,
  'lastActionAt',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'completed_at', type: 'datetime', nullable: true }),
    __metadata('design:type', Date),
  ],
  ApprovalRequest.prototype,
  'completedAt',
  void 0
);
__decorate(
  [(0, typeorm_1.CreateDateColumn)({ name: 'created_at' }), __metadata('design:type', Date)],
  ApprovalRequest.prototype,
  'createdAt',
  void 0
);
__decorate(
  [(0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }), __metadata('design:type', Date)],
  ApprovalRequest.prototype,
  'updatedAt',
  void 0
);
__decorate(
  [(0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }), __metadata('design:type', Date)],
  ApprovalRequest.prototype,
  'deletedAt',
  void 0
);
exports.ApprovalRequest = ApprovalRequest = __decorate(
  [(0, typeorm_1.Entity)('approval_requests')],
  ApprovalRequest
);
//# sourceMappingURL=approval-request.entity.js.map
