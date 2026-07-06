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
exports.DocumentEmbedding = void 0;
const typeorm_1 = require('typeorm');
const document_chunk_entity_1 = require('./document-chunk.entity');
let DocumentEmbedding = class DocumentEmbedding {
  id;
  chunkId;
  chunk;
  provider;
  model;
  dimensions;
  embedding;
  contentHash;
  createdAt;
};
exports.DocumentEmbedding = DocumentEmbedding;
__decorate(
  [(0, typeorm_1.PrimaryGeneratedColumn)('uuid'), __metadata('design:type', String)],
  DocumentEmbedding.prototype,
  'id',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'chunk_id' }), __metadata('design:type', String)],
  DocumentEmbedding.prototype,
  'chunkId',
  void 0
);
__decorate(
  [
    (0, typeorm_1.ManyToOne)(
      () => document_chunk_entity_1.DocumentChunk,
      (chunk) => chunk.embeddings
    ),
    (0, typeorm_1.JoinColumn)({ name: 'chunk_id' }),
    __metadata('design:type', document_chunk_entity_1.DocumentChunk),
  ],
  DocumentEmbedding.prototype,
  'chunk',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ length: 80 }), __metadata('design:type', String)],
  DocumentEmbedding.prototype,
  'provider',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ length: 120 }), __metadata('design:type', String)],
  DocumentEmbedding.prototype,
  'model',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)(), __metadata('design:type', Number)],
  DocumentEmbedding.prototype,
  'dimensions',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ type: 'json' }), __metadata('design:type', Array)],
  DocumentEmbedding.prototype,
  'embedding',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'content_hash', length: 128 }), __metadata('design:type', String)],
  DocumentEmbedding.prototype,
  'contentHash',
  void 0
);
__decorate(
  [(0, typeorm_1.CreateDateColumn)({ name: 'created_at' }), __metadata('design:type', Date)],
  DocumentEmbedding.prototype,
  'createdAt',
  void 0
);
exports.DocumentEmbedding = DocumentEmbedding = __decorate(
  [(0, typeorm_1.Entity)('document_embeddings')],
  DocumentEmbedding
);
//# sourceMappingURL=document-embedding.entity.js.map
