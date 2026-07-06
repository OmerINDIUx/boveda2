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
exports.DocumentQueryHistory = void 0;
const typeorm_1 = require('typeorm');
const project_entity_1 = require('../projects/project.entity');
const user_entity_1 = require('../users/user.entity');
let DocumentQueryHistory = class DocumentQueryHistory {
  id;
  userId;
  user;
  projectId;
  project;
  documentId;
  question;
  answer;
  status;
  citationsJson;
  responseJson;
  createdAt;
};
exports.DocumentQueryHistory = DocumentQueryHistory;
__decorate(
  [(0, typeorm_1.PrimaryGeneratedColumn)('uuid'), __metadata('design:type', String)],
  DocumentQueryHistory.prototype,
  'id',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'user_id' }), __metadata('design:type', String)],
  DocumentQueryHistory.prototype,
  'userId',
  void 0
);
__decorate(
  [
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata('design:type', user_entity_1.User),
  ],
  DocumentQueryHistory.prototype,
  'user',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'project_id', nullable: true }),
    __metadata('design:type', String),
  ],
  DocumentQueryHistory.prototype,
  'projectId',
  void 0
);
__decorate(
  [
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'project_id' }),
    __metadata('design:type', project_entity_1.Project),
  ],
  DocumentQueryHistory.prototype,
  'project',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'document_id', nullable: true }),
    __metadata('design:type', String),
  ],
  DocumentQueryHistory.prototype,
  'documentId',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ type: 'text' }), __metadata('design:type', String)],
  DocumentQueryHistory.prototype,
  'question',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ type: 'longtext' }), __metadata('design:type', String)],
  DocumentQueryHistory.prototype,
  'answer',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ length: 40 }), __metadata('design:type', String)],
  DocumentQueryHistory.prototype,
  'status',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'citations_json', type: 'json', nullable: true }),
    __metadata('design:type', Array),
  ],
  DocumentQueryHistory.prototype,
  'citationsJson',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'response_json', type: 'json', nullable: true }),
    __metadata('design:type', Object),
  ],
  DocumentQueryHistory.prototype,
  'responseJson',
  void 0
);
__decorate(
  [(0, typeorm_1.CreateDateColumn)({ name: 'created_at' }), __metadata('design:type', Date)],
  DocumentQueryHistory.prototype,
  'createdAt',
  void 0
);
exports.DocumentQueryHistory = DocumentQueryHistory = __decorate(
  [(0, typeorm_1.Entity)('document_query_history')],
  DocumentQueryHistory
);
//# sourceMappingURL=document-query-history.entity.js.map
