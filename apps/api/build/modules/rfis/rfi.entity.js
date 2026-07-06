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
exports.Rfi = void 0;
const typeorm_1 = require('typeorm');
const document_entity_1 = require('../documents/document.entity');
const project_entity_1 = require('../projects/project.entity');
const user_entity_1 = require('../users/user.entity');
const rfi_attachment_entity_1 = require('./rfi-attachment.entity');
const rfi_comment_entity_1 = require('./rfi-comment.entity');
const rfi_history_entity_1 = require('./rfi-history.entity');
let Rfi = class Rfi {
  id;
  projectId;
  project;
  documentId;
  document;
  title;
  description;
  answer;
  status;
  priority;
  dueDate;
  createdById;
  requester;
  assignedToId;
  assignedTo;
  closedAt;
  comments;
  attachments;
  history;
  createdAt;
  updatedAt;
  deletedAt;
};
exports.Rfi = Rfi;
__decorate(
  [(0, typeorm_1.PrimaryGeneratedColumn)('uuid'), __metadata('design:type', String)],
  Rfi.prototype,
  'id',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'project_id' }), __metadata('design:type', String)],
  Rfi.prototype,
  'projectId',
  void 0
);
__decorate(
  [
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project),
    (0, typeorm_1.JoinColumn)({ name: 'project_id' }),
    __metadata('design:type', project_entity_1.Project),
  ],
  Rfi.prototype,
  'project',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'document_id', nullable: true }),
    __metadata('design:type', String),
  ],
  Rfi.prototype,
  'documentId',
  void 0
);
__decorate(
  [
    (0, typeorm_1.ManyToOne)(() => document_entity_1.DocumentRecord),
    (0, typeorm_1.JoinColumn)({ name: 'document_id' }),
    __metadata('design:type', document_entity_1.DocumentRecord),
  ],
  Rfi.prototype,
  'document',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'subject', length: 180 }), __metadata('design:type', String)],
  Rfi.prototype,
  'title',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'question', type: 'text' }), __metadata('design:type', String)],
  Rfi.prototype,
  'description',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ type: 'text', nullable: true }), __metadata('design:type', String)],
  Rfi.prototype,
  'answer',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ default: 'open' }), __metadata('design:type', String)],
  Rfi.prototype,
  'status',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ default: 'normal' }), __metadata('design:type', String)],
  Rfi.prototype,
  'priority',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'due_date', type: 'date', nullable: true }),
    __metadata('design:type', String),
  ],
  Rfi.prototype,
  'dueDate',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'created_by_id' }), __metadata('design:type', String)],
  Rfi.prototype,
  'createdById',
  void 0
);
__decorate(
  [
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by_id' }),
    __metadata('design:type', user_entity_1.User),
  ],
  Rfi.prototype,
  'requester',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'assigned_to_id', nullable: true }),
    __metadata('design:type', String),
  ],
  Rfi.prototype,
  'assignedToId',
  void 0
);
__decorate(
  [
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'assigned_to_id' }),
    __metadata('design:type', user_entity_1.User),
  ],
  Rfi.prototype,
  'assignedTo',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'closed_at', type: 'datetime', nullable: true }),
    __metadata('design:type', Date),
  ],
  Rfi.prototype,
  'closedAt',
  void 0
);
__decorate(
  [
    (0, typeorm_1.OneToMany)(
      () => rfi_comment_entity_1.RfiComment,
      (comment) => comment.rfi
    ),
    __metadata('design:type', Array),
  ],
  Rfi.prototype,
  'comments',
  void 0
);
__decorate(
  [
    (0, typeorm_1.OneToMany)(
      () => rfi_attachment_entity_1.RfiAttachment,
      (attachment) => attachment.rfi
    ),
    __metadata('design:type', Array),
  ],
  Rfi.prototype,
  'attachments',
  void 0
);
__decorate(
  [
    (0, typeorm_1.OneToMany)(
      () => rfi_history_entity_1.RfiHistory,
      (history) => history.rfi
    ),
    __metadata('design:type', Array),
  ],
  Rfi.prototype,
  'history',
  void 0
);
__decorate(
  [(0, typeorm_1.CreateDateColumn)({ name: 'created_at' }), __metadata('design:type', Date)],
  Rfi.prototype,
  'createdAt',
  void 0
);
__decorate(
  [(0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }), __metadata('design:type', Date)],
  Rfi.prototype,
  'updatedAt',
  void 0
);
__decorate(
  [(0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }), __metadata('design:type', Date)],
  Rfi.prototype,
  'deletedAt',
  void 0
);
exports.Rfi = Rfi = __decorate([(0, typeorm_1.Entity)('rfis')], Rfi);
//# sourceMappingURL=rfi.entity.js.map
