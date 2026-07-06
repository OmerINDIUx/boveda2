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
Object.defineProperty(exports, '__esModule', { value: true });
exports.AiQueryModule = void 0;
const common_1 = require('@nestjs/common');
const typeorm_1 = require('@nestjs/typeorm');
const audit_module_1 = require('../audit/audit.module');
const document_chunk_entity_1 = require('../documents/document-chunk.entity');
const document_permission_entity_1 = require('../documents/document-permission.entity');
const document_entity_1 = require('../documents/document.entity');
const documents_module_1 = require('../documents/documents.module');
const project_member_entity_1 = require('../projects/project-member.entity');
const storage_module_1 = require('../../storage/storage.module');
const user_entity_1 = require('../users/user.entity');
const document_version_entity_1 = require('../versions/document-version.entity');
const ai_query_controller_1 = require('./ai-query.controller');
const document_indexing_service_1 = require('./document-indexing.service');
const document_query_history_entity_1 = require('./document-query-history.entity');
const ai_query_service_1 = require('./ai-query.service');
let AiQueryModule = class AiQueryModule {};
exports.AiQueryModule = AiQueryModule;
exports.AiQueryModule = AiQueryModule = __decorate(
  [
    (0, common_1.Module)({
      imports: [
        documents_module_1.DocumentsModule,
        audit_module_1.AuditModule,
        storage_module_1.StorageModule,
        typeorm_1.TypeOrmModule.forFeature([
          document_entity_1.DocumentRecord,
          document_version_entity_1.DocumentVersion,
          document_chunk_entity_1.DocumentChunk,
          document_permission_entity_1.DocumentPermission,
          document_query_history_entity_1.DocumentQueryHistory,
          user_entity_1.User,
          project_member_entity_1.ProjectMember,
        ]),
      ],
      controllers: [ai_query_controller_1.AiQueryController],
      providers: [
        ai_query_service_1.AiQueryService,
        document_indexing_service_1.DocumentIndexingService,
      ],
    }),
  ],
  AiQueryModule
);
//# sourceMappingURL=ai-query.module.js.map
