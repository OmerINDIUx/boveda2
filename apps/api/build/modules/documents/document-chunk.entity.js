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
exports.DocumentChunk = void 0;
const typeorm_1 = require('typeorm');
const document_embedding_entity_1 = require('./document-embedding.entity');
let DocumentChunk = class DocumentChunk {
  id;
  documentId;
  versionId;
  chunkIndex;
  content;
  tokenCount;
  pageNumber;
  sectionLabel;
  embeddings;
  createdAt;
};
exports.DocumentChunk = DocumentChunk;
__decorate(
  [(0, typeorm_1.PrimaryGeneratedColumn)('uuid'), __metadata('design:type', String)],
  DocumentChunk.prototype,
  'id',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'document_id' }), __metadata('design:type', String)],
  DocumentChunk.prototype,
  'documentId',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'version_id', nullable: true }),
    __metadata('design:type', String),
  ],
  DocumentChunk.prototype,
  'versionId',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'chunk_index' }), __metadata('design:type', Number)],
  DocumentChunk.prototype,
  'chunkIndex',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ type: 'longtext' }), __metadata('design:type', String)],
  DocumentChunk.prototype,
  'content',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'token_count', nullable: true }),
    __metadata('design:type', Number),
  ],
  DocumentChunk.prototype,
  'tokenCount',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'page_number', nullable: true }),
    __metadata('design:type', Number),
  ],
  DocumentChunk.prototype,
  'pageNumber',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'section_label', length: 255, nullable: true }),
    __metadata('design:type', String),
  ],
  DocumentChunk.prototype,
  'sectionLabel',
  void 0
);
__decorate(
  [
    (0, typeorm_1.OneToMany)(
      () => document_embedding_entity_1.DocumentEmbedding,
      (embedding) => embedding.chunk
    ),
    __metadata('design:type', Array),
  ],
  DocumentChunk.prototype,
  'embeddings',
  void 0
);
__decorate(
  [(0, typeorm_1.CreateDateColumn)({ name: 'created_at' }), __metadata('design:type', Date)],
  DocumentChunk.prototype,
  'createdAt',
  void 0
);
exports.DocumentChunk = DocumentChunk = __decorate(
  [(0, typeorm_1.Entity)('document_chunks')],
  DocumentChunk
);
//# sourceMappingURL=document-chunk.entity.js.map
