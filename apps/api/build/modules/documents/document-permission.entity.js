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
exports.DocumentPermission = void 0;
const typeorm_1 = require('typeorm');
const document_entity_1 = require('./document.entity');
let DocumentPermission = class DocumentPermission {
  id;
  documentId;
  document;
  userId;
  roleId;
  projectUserId;
  permission;
  grantedById;
  expiresAt;
  createdAt;
  updatedAt;
  deletedAt;
};
exports.DocumentPermission = DocumentPermission;
__decorate(
  [(0, typeorm_1.PrimaryGeneratedColumn)('uuid'), __metadata('design:type', String)],
  DocumentPermission.prototype,
  'id',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'document_id' }), __metadata('design:type', String)],
  DocumentPermission.prototype,
  'documentId',
  void 0
);
__decorate(
  [
    (0, typeorm_1.ManyToOne)(
      () => document_entity_1.DocumentRecord,
      (document) => document.permissions
    ),
    (0, typeorm_1.JoinColumn)({ name: 'document_id' }),
    __metadata('design:type', document_entity_1.DocumentRecord),
  ],
  DocumentPermission.prototype,
  'document',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'user_id', nullable: true }), __metadata('design:type', String)],
  DocumentPermission.prototype,
  'userId',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'role_id', nullable: true }), __metadata('design:type', String)],
  DocumentPermission.prototype,
  'roleId',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'project_user_id', nullable: true }),
    __metadata('design:type', String),
  ],
  DocumentPermission.prototype,
  'projectUserId',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ length: 40 }), __metadata('design:type', String)],
  DocumentPermission.prototype,
  'permission',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'granted_by_id', nullable: true }),
    __metadata('design:type', String),
  ],
  DocumentPermission.prototype,
  'grantedById',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'expires_at', type: 'datetime', nullable: true }),
    __metadata('design:type', Date),
  ],
  DocumentPermission.prototype,
  'expiresAt',
  void 0
);
__decorate(
  [(0, typeorm_1.CreateDateColumn)({ name: 'created_at' }), __metadata('design:type', Date)],
  DocumentPermission.prototype,
  'createdAt',
  void 0
);
__decorate(
  [(0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }), __metadata('design:type', Date)],
  DocumentPermission.prototype,
  'updatedAt',
  void 0
);
__decorate(
  [(0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }), __metadata('design:type', Date)],
  DocumentPermission.prototype,
  'deletedAt',
  void 0
);
exports.DocumentPermission = DocumentPermission = __decorate(
  [(0, typeorm_1.Entity)('document_permissions')],
  DocumentPermission
);
//# sourceMappingURL=document-permission.entity.js.map
