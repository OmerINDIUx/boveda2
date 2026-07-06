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
exports.ContractObligation = void 0;
const typeorm_1 = require('typeorm');
const document_entity_1 = require('../documents/document.entity');
const user_entity_1 = require('../users/user.entity');
const contract_entity_1 = require('./contract.entity');
let ContractObligation = class ContractObligation {
  id;
  contractId;
  contract;
  description;
  responsibleUserId;
  responsibleUser;
  commitmentDate;
  status;
  evidenceDocumentId;
  evidenceDocument;
  comments;
  createdAt;
  updatedAt;
  deletedAt;
};
exports.ContractObligation = ContractObligation;
__decorate(
  [(0, typeorm_1.PrimaryGeneratedColumn)('uuid'), __metadata('design:type', String)],
  ContractObligation.prototype,
  'id',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'contract_id' }), __metadata('design:type', String)],
  ContractObligation.prototype,
  'contractId',
  void 0
);
__decorate(
  [
    (0, typeorm_1.ManyToOne)(
      () => contract_entity_1.Contract,
      (contract) => contract.obligations
    ),
    (0, typeorm_1.JoinColumn)({ name: 'contract_id' }),
    __metadata('design:type', contract_entity_1.Contract),
  ],
  ContractObligation.prototype,
  'contract',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ type: 'text' }), __metadata('design:type', String)],
  ContractObligation.prototype,
  'description',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'responsible_user_id', nullable: true }),
    __metadata('design:type', String),
  ],
  ContractObligation.prototype,
  'responsibleUserId',
  void 0
);
__decorate(
  [
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'responsible_user_id' }),
    __metadata('design:type', user_entity_1.User),
  ],
  ContractObligation.prototype,
  'responsibleUser',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'commitment_date', type: 'date', nullable: true }),
    __metadata('design:type', String),
  ],
  ContractObligation.prototype,
  'commitmentDate',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ default: 'pending' }), __metadata('design:type', String)],
  ContractObligation.prototype,
  'status',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'evidence_document_id', nullable: true }),
    __metadata('design:type', String),
  ],
  ContractObligation.prototype,
  'evidenceDocumentId',
  void 0
);
__decorate(
  [
    (0, typeorm_1.ManyToOne)(() => document_entity_1.DocumentRecord, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'evidence_document_id' }),
    __metadata('design:type', document_entity_1.DocumentRecord),
  ],
  ContractObligation.prototype,
  'evidenceDocument',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ type: 'text', nullable: true }), __metadata('design:type', String)],
  ContractObligation.prototype,
  'comments',
  void 0
);
__decorate(
  [(0, typeorm_1.CreateDateColumn)({ name: 'created_at' }), __metadata('design:type', Date)],
  ContractObligation.prototype,
  'createdAt',
  void 0
);
__decorate(
  [(0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }), __metadata('design:type', Date)],
  ContractObligation.prototype,
  'updatedAt',
  void 0
);
__decorate(
  [(0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }), __metadata('design:type', Date)],
  ContractObligation.prototype,
  'deletedAt',
  void 0
);
exports.ContractObligation = ContractObligation = __decorate(
  [(0, typeorm_1.Entity)('contract_obligations')],
  ContractObligation
);
//# sourceMappingURL=contract-obligation.entity.js.map
