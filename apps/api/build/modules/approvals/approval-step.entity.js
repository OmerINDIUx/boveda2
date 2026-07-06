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
exports.ApprovalStep = void 0;
const typeorm_1 = require('typeorm');
const approval_flow_entity_1 = require('./approval-flow.entity');
let ApprovalStep = class ApprovalStep {
  id;
  workflowId;
  workflow;
  stepOrder;
  name;
  approverRoleId;
  approverUserId;
  required;
  createdAt;
  updatedAt;
};
exports.ApprovalStep = ApprovalStep;
__decorate(
  [(0, typeorm_1.PrimaryGeneratedColumn)('uuid'), __metadata('design:type', String)],
  ApprovalStep.prototype,
  'id',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'workflow_id' }), __metadata('design:type', String)],
  ApprovalStep.prototype,
  'workflowId',
  void 0
);
__decorate(
  [
    (0, typeorm_1.ManyToOne)(
      () => approval_flow_entity_1.ApprovalFlow,
      (workflow) => workflow.steps
    ),
    (0, typeorm_1.JoinColumn)({ name: 'workflow_id' }),
    __metadata('design:type', approval_flow_entity_1.ApprovalFlow),
  ],
  ApprovalStep.prototype,
  'workflow',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'step_order' }), __metadata('design:type', Number)],
  ApprovalStep.prototype,
  'stepOrder',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ length: 140 }), __metadata('design:type', String)],
  ApprovalStep.prototype,
  'name',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'approver_role_id', nullable: true }),
    __metadata('design:type', String),
  ],
  ApprovalStep.prototype,
  'approverRoleId',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'approver_user_id', nullable: true }),
    __metadata('design:type', String),
  ],
  ApprovalStep.prototype,
  'approverUserId',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ default: true }), __metadata('design:type', Boolean)],
  ApprovalStep.prototype,
  'required',
  void 0
);
__decorate(
  [(0, typeorm_1.CreateDateColumn)({ name: 'created_at' }), __metadata('design:type', Date)],
  ApprovalStep.prototype,
  'createdAt',
  void 0
);
__decorate(
  [(0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }), __metadata('design:type', Date)],
  ApprovalStep.prototype,
  'updatedAt',
  void 0
);
exports.ApprovalStep = ApprovalStep = __decorate(
  [(0, typeorm_1.Entity)('approval_steps')],
  ApprovalStep
);
//# sourceMappingURL=approval-step.entity.js.map
