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
exports.Contract = void 0;
const typeorm_1 = require('typeorm');
const document_entity_1 = require('../documents/document.entity');
const project_entity_1 = require('../projects/project.entity');
const user_entity_1 = require('../users/user.entity');
const contract_attachment_entity_1 = require('./contract-attachment.entity');
const contract_audit_log_entity_1 = require('./contract-audit-log.entity');
const contract_comment_entity_1 = require('./contract-comment.entity');
const contract_milestone_entity_1 = require('./contract-milestone.entity');
const contract_obligation_entity_1 = require('./contract-obligation.entity');
const contract_version_entity_1 = require('./contract-version.entity');
let Contract = class Contract {
  id;
  projectId;
  project;
  name;
  supplierName;
  clientName;
  responsibleArea;
  contractType;
  startDate;
  endDate;
  renewalDate;
  amount;
  currency;
  status;
  responsibleUserId;
  responsibleUser;
  mainDocumentId;
  mainDocument;
  currentVersionId;
  renewable;
  renewalNoticeDays;
  closedAt;
  closeReason;
  createdById;
  createdBy;
  versions;
  obligations;
  milestones;
  attachments;
  comments;
  auditLogs;
  createdAt;
  updatedAt;
  deletedAt;
};
exports.Contract = Contract;
__decorate(
  [(0, typeorm_1.PrimaryGeneratedColumn)('uuid'), __metadata('design:type', String)],
  Contract.prototype,
  'id',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'project_id' }), __metadata('design:type', String)],
  Contract.prototype,
  'projectId',
  void 0
);
__decorate(
  [
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project),
    (0, typeorm_1.JoinColumn)({ name: 'project_id' }),
    __metadata('design:type', project_entity_1.Project),
  ],
  Contract.prototype,
  'project',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ length: 180 }), __metadata('design:type', String)],
  Contract.prototype,
  'name',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'supplier_name', length: 180, nullable: true }),
    __metadata('design:type', String),
  ],
  Contract.prototype,
  'supplierName',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'client_name', length: 180, nullable: true }),
    __metadata('design:type', String),
  ],
  Contract.prototype,
  'clientName',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'responsible_area', length: 160, nullable: true }),
    __metadata('design:type', String),
  ],
  Contract.prototype,
  'responsibleArea',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'contract_type', length: 100, nullable: true }),
    __metadata('design:type', String),
  ],
  Contract.prototype,
  'contractType',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'start_date', type: 'date', nullable: true }),
    __metadata('design:type', String),
  ],
  Contract.prototype,
  'startDate',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'end_date', type: 'date', nullable: true }),
    __metadata('design:type', String),
  ],
  Contract.prototype,
  'endDate',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'renewal_date', type: 'date', nullable: true }),
    __metadata('design:type', String),
  ],
  Contract.prototype,
  'renewalDate',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 2, nullable: true }),
    __metadata('design:type', String),
  ],
  Contract.prototype,
  'amount',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ length: 3, default: 'MXN' }), __metadata('design:type', String)],
  Contract.prototype,
  'currency',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ default: 'draft' }), __metadata('design:type', String)],
  Contract.prototype,
  'status',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'responsible_user_id', nullable: true }),
    __metadata('design:type', String),
  ],
  Contract.prototype,
  'responsibleUserId',
  void 0
);
__decorate(
  [
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'responsible_user_id' }),
    __metadata('design:type', user_entity_1.User),
  ],
  Contract.prototype,
  'responsibleUser',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'main_document_id', nullable: true }),
    __metadata('design:type', String),
  ],
  Contract.prototype,
  'mainDocumentId',
  void 0
);
__decorate(
  [
    (0, typeorm_1.ManyToOne)(() => document_entity_1.DocumentRecord, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'main_document_id' }),
    __metadata('design:type', document_entity_1.DocumentRecord),
  ],
  Contract.prototype,
  'mainDocument',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'current_version_id', nullable: true }),
    __metadata('design:type', String),
  ],
  Contract.prototype,
  'currentVersionId',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ default: false }), __metadata('design:type', Boolean)],
  Contract.prototype,
  'renewable',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'renewal_notice_days', nullable: true }),
    __metadata('design:type', Number),
  ],
  Contract.prototype,
  'renewalNoticeDays',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'closed_at', type: 'datetime', nullable: true }),
    __metadata('design:type', Date),
  ],
  Contract.prototype,
  'closedAt',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'close_reason', type: 'text', nullable: true }),
    __metadata('design:type', String),
  ],
  Contract.prototype,
  'closeReason',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'created_by_id', nullable: true }),
    __metadata('design:type', String),
  ],
  Contract.prototype,
  'createdById',
  void 0
);
__decorate(
  [
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by_id' }),
    __metadata('design:type', user_entity_1.User),
  ],
  Contract.prototype,
  'createdBy',
  void 0
);
__decorate(
  [
    (0, typeorm_1.OneToMany)(
      () => contract_version_entity_1.ContractVersion,
      (version) => version.contract
    ),
    __metadata('design:type', Array),
  ],
  Contract.prototype,
  'versions',
  void 0
);
__decorate(
  [
    (0, typeorm_1.OneToMany)(
      () => contract_obligation_entity_1.ContractObligation,
      (obligation) => obligation.contract
    ),
    __metadata('design:type', Array),
  ],
  Contract.prototype,
  'obligations',
  void 0
);
__decorate(
  [
    (0, typeorm_1.OneToMany)(
      () => contract_milestone_entity_1.ContractMilestone,
      (milestone) => milestone.contract
    ),
    __metadata('design:type', Array),
  ],
  Contract.prototype,
  'milestones',
  void 0
);
__decorate(
  [
    (0, typeorm_1.OneToMany)(
      () => contract_attachment_entity_1.ContractAttachment,
      (attachment) => attachment.contract
    ),
    __metadata('design:type', Array),
  ],
  Contract.prototype,
  'attachments',
  void 0
);
__decorate(
  [
    (0, typeorm_1.OneToMany)(
      () => contract_comment_entity_1.ContractComment,
      (comment) => comment.contract
    ),
    __metadata('design:type', Array),
  ],
  Contract.prototype,
  'comments',
  void 0
);
__decorate(
  [
    (0, typeorm_1.OneToMany)(
      () => contract_audit_log_entity_1.ContractAuditLog,
      (log) => log.contract
    ),
    __metadata('design:type', Array),
  ],
  Contract.prototype,
  'auditLogs',
  void 0
);
__decorate(
  [(0, typeorm_1.CreateDateColumn)({ name: 'created_at' }), __metadata('design:type', Date)],
  Contract.prototype,
  'createdAt',
  void 0
);
__decorate(
  [(0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }), __metadata('design:type', Date)],
  Contract.prototype,
  'updatedAt',
  void 0
);
__decorate(
  [(0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }), __metadata('design:type', Date)],
  Contract.prototype,
  'deletedAt',
  void 0
);
exports.Contract = Contract = __decorate([(0, typeorm_1.Entity)('contracts')], Contract);
//# sourceMappingURL=contract.entity.js.map
