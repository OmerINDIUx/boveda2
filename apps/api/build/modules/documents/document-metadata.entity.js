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
exports.DocumentMetadata = void 0;
const typeorm_1 = require('typeorm');
const document_entity_1 = require('./document.entity');
let DocumentMetadata = class DocumentMetadata {
  id;
  documentId;
  document;
  metaKey;
  metaValue;
  valueType;
  createdAt;
  updatedAt;
};
exports.DocumentMetadata = DocumentMetadata;
__decorate(
  [(0, typeorm_1.PrimaryGeneratedColumn)('uuid'), __metadata('design:type', String)],
  DocumentMetadata.prototype,
  'id',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'document_id' }), __metadata('design:type', String)],
  DocumentMetadata.prototype,
  'documentId',
  void 0
);
__decorate(
  [
    (0, typeorm_1.ManyToOne)(
      () => document_entity_1.DocumentRecord,
      (document) => document.metadata
    ),
    (0, typeorm_1.JoinColumn)({ name: 'document_id' }),
    __metadata('design:type', document_entity_1.DocumentRecord),
  ],
  DocumentMetadata.prototype,
  'document',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'meta_key', length: 120 }), __metadata('design:type', String)],
  DocumentMetadata.prototype,
  'metaKey',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'meta_value', type: 'text', nullable: true }),
    __metadata('design:type', String),
  ],
  DocumentMetadata.prototype,
  'metaValue',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'value_type', default: 'string' }),
    __metadata('design:type', String),
  ],
  DocumentMetadata.prototype,
  'valueType',
  void 0
);
__decorate(
  [(0, typeorm_1.CreateDateColumn)({ name: 'created_at' }), __metadata('design:type', Date)],
  DocumentMetadata.prototype,
  'createdAt',
  void 0
);
__decorate(
  [(0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }), __metadata('design:type', Date)],
  DocumentMetadata.prototype,
  'updatedAt',
  void 0
);
exports.DocumentMetadata = DocumentMetadata = __decorate(
  [(0, typeorm_1.Entity)('document_metadata')],
  DocumentMetadata
);
//# sourceMappingURL=document-metadata.entity.js.map
