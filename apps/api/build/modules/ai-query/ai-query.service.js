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
var __param =
  (this && this.__param) ||
  function (paramIndex, decorator) {
    return function (target, key) {
      decorator(target, key, paramIndex);
    };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.AiQueryService = void 0;
const common_1 = require('@nestjs/common');
const typeorm_1 = require('@nestjs/typeorm');
const typeorm_2 = require('typeorm');
const access_scope_service_1 = require('../../common/access-scope.service');
const audit_service_1 = require('../audit/audit.service');
const document_chunk_entity_1 = require('../documents/document-chunk.entity');
const document_permission_entity_1 = require('../documents/document-permission.entity');
const document_entity_1 = require('../documents/document.entity');
const project_member_entity_1 = require('../projects/project-member.entity');
const user_entity_1 = require('../users/user.entity');
const document_version_entity_1 = require('../versions/document-version.entity');
const document_indexing_service_1 = require('./document-indexing.service');
const document_query_history_entity_1 = require('./document-query-history.entity');
let AiQueryService = class AiQueryService {
  documents;
  versions;
  chunks;
  permissions;
  history;
  users;
  members;
  scope;
  indexing;
  audit;
  constructor(
    documents,
    versions,
    chunks,
    permissions,
    history,
    users,
    members,
    scope,
    indexing,
    audit
  ) {
    this.documents = documents;
    this.versions = versions;
    this.chunks = chunks;
    this.permissions = permissions;
    this.history = history;
    this.users = users;
    this.members = members;
    this.scope = scope;
    this.indexing = indexing;
    this.audit = audit;
  }
  async ask(userId, dto) {
    const visibleDocuments = await this.getVisibleDocuments(userId, dto);
    const response = await this.buildGroundedResponse(visibleDocuments, dto.question);
    const historyEntry = await this.history.save(
      this.history.create({
        userId,
        projectId: dto.projectId,
        documentId: dto.documentId,
        question: dto.question,
        answer: response.answer,
        status: response.status,
        citationsJson: response.citations,
        responseJson: {
          scopedDocumentCount: visibleDocuments.length,
          insufficientInformation: response.status !== 'answered',
        },
      })
    );
    await this.audit.record({
      actorId: userId,
      action: 'ai_query.ask',
      entityType: 'document_query',
      entityId: historyEntry.id,
      metadata: {
        projectId: dto.projectId,
        documentId: dto.documentId,
        question: dto.question,
        scopedDocumentCount: visibleDocuments.length,
        citationCount: response.citations.length,
        status: response.status,
      },
    });
    return {
      id: historyEntry.id,
      question: dto.question,
      answer: response.answer,
      status: response.status,
      scopedDocumentCount: visibleDocuments.length,
      citations: response.citations,
    };
  }
  async historyForUser(userId) {
    return this.history.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 30,
    });
  }
  async getVisibleDocuments(userId, dto) {
    if (dto.projectId && !(await this.scope.canAccessProject(userId, dto.projectId))) {
      throw new common_1.ForbiddenException('No tienes acceso a este proyecto');
    }
    const user = await this.users.findOne({ where: { id: userId }, relations: ['roles'] });
    if (!user) {
      throw new common_1.NotFoundException('Usuario no encontrado');
    }
    const visibleProjectIds = dto.projectId
      ? [dto.projectId]
      : await this.scope.visibleProjectIdsForUser(userId);
    if (!visibleProjectIds.length) {
      return [];
    }
    const memberships = await this.members.find({
      where: { userId, projectId: (0, typeorm_2.In)(visibleProjectIds) },
    });
    const roleIds = user.roles?.map((role) => role.id) ?? [];
    const projectUserIds = memberships.map((membership) => membership.id);
    const rawDocuments = await this.documents.find({
      where: {
        projectId: (0, typeorm_2.In)(visibleProjectIds),
        ...(dto.documentId ? { id: dto.documentId } : {}),
      },
      order: { updatedAt: 'DESC' },
    });
    if (dto.documentId && !rawDocuments.length) {
      throw new common_1.NotFoundException(
        'Documento no encontrado dentro del alcance del usuario'
      );
    }
    const permissionRows = rawDocuments.length
      ? await this.permissions.find({
          where: {
            documentId: (0, typeorm_2.In)(rawDocuments.map((document) => document.id)),
            deletedAt: (0, typeorm_2.IsNull)(),
          },
        })
      : [];
    return rawDocuments.filter((document) => {
      const rows = permissionRows.filter((row) => row.documentId === document.id);
      if (!rows.length) {
        return true;
      }
      return rows.some((row) => {
        if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
          return false;
        }
        return (
          row.userId === userId ||
          (row.roleId ? roleIds.includes(row.roleId) : false) ||
          (row.projectUserId ? projectUserIds.includes(row.projectUserId) : false)
        );
      });
    });
  }
  async buildGroundedResponse(visibleDocuments, question) {
    if (!visibleDocuments.length) {
      return {
        status: 'insufficient_information',
        answer:
          'No hay documentos autorizados dentro del alcance actual para responder esta consulta.',
        citations: [],
      };
    }
    const currentVersionIds = visibleDocuments
      .map((document) => document.currentVersionId)
      .filter((value) => Boolean(value));
    if (!currentVersionIds.length) {
      return {
        status: 'insufficient_information',
        answer:
          'Los documentos autorizados aun no tienen una version indexable para responder esta consulta.',
        citations: [],
      };
    }
    const currentVersions = await this.versions.find({
      where: { id: (0, typeorm_2.In)(currentVersionIds) },
    });
    const versionsById = new Map(currentVersions.map((version) => [version.id, version]));
    const visibleDocumentsWithVersion = visibleDocuments.filter(
      (document) => document.currentVersionId && versionsById.has(document.currentVersionId)
    );
    for (const document of visibleDocumentsWithVersion) {
      await this.indexing.ensureVersionIndexed(
        document,
        versionsById.get(document.currentVersionId)
      );
    }
    const searchResults = await this.indexing.searchVisibleChunks(
      visibleDocumentsWithVersion.map((document) => document.id),
      question
    );
    const citedChunks = await this.toCitations(
      searchResults,
      visibleDocumentsWithVersion,
      versionsById
    );
    if (!citedChunks.length) {
      return {
        status: 'insufficient_information',
        answer:
          'No encontre informacion suficiente en los documentos autorizados para responder con seguridad. Intenta reformular la pregunta o acotarla a un documento especifico.',
        citations: [],
      };
    }
    return {
      status: 'answered',
      answer: this.composeAnswer(question, citedChunks),
      citations: citedChunks,
    };
  }
  async toCitations(searchResults, documents, versionsById) {
    if (!searchResults.length) {
      return [];
    }
    const documentsById = new Map(documents.map((document) => [document.id, document]));
    const chunksWithVersions = await this.chunks.find({
      where: { id: (0, typeorm_2.In)(searchResults.map((result) => result.chunk.id)) },
    });
    const chunkMap = new Map(chunksWithVersions.map((chunk) => [chunk.id, chunk]));
    return searchResults.map((result) => {
      const chunk = chunkMap.get(result.chunk.id) ?? result.chunk;
      const document = documentsById.get(chunk.documentId);
      const version = chunk.versionId ? versionsById.get(chunk.versionId) : undefined;
      return {
        chunkId: chunk.id,
        documentId: chunk.documentId,
        documentName: document?.name ?? 'Documento',
        versionId: version?.id,
        versionLabel: version?.revision ?? 'N/D',
        pageNumber: chunk.pageNumber,
        sectionLabel: chunk.sectionLabel,
        fragment: this.trimFragment(chunk.content),
        score: Number(result.score.toFixed(4)),
      };
    });
  }
  composeAnswer(question, citations) {
    const normalizedQuestion = question.toLowerCase();
    const grouped = new Map();
    for (const citation of citations) {
      const key = `${citation.documentId}:${citation.versionLabel}`;
      grouped.set(key, [...(grouped.get(key) ?? []), citation]);
    }
    if (/(resume|resumen|sintetiza)/i.test(normalizedQuestion)) {
      return Array.from(grouped.values())
        .slice(0, 3)
        .map((items) => {
          const lead = items[0];
          const details = items
            .slice(0, 2)
            .map((item) => item.fragment)
            .join(' ');
          return `${lead.documentName} (version ${lead.versionLabel}): ${details}`;
        })
        .join('\n\n');
    }
    if (/(que documentos|cuales documentos|mencionan)/i.test(normalizedQuestion)) {
      return Array.from(grouped.values())
        .map((items) => {
          const lead = items[0];
          return `${lead.documentName} (version ${lead.versionLabel}) menciona el tema en: ${lead.fragment}`;
        })
        .join('\n');
    }
    if (/(ultima version aprobada|version aprobada|ultima version)/i.test(normalizedQuestion)) {
      return Array.from(grouped.values())
        .slice(0, 5)
        .map((items) => {
          const lead = items[0];
          return `${lead.documentName}: ${lead.fragment}`;
        })
        .join('\n');
    }
    return citations
      .slice(0, 4)
      .map(
        (citation, index) =>
          `${index + 1}. ${citation.documentName} (version ${citation.versionLabel}): ${citation.fragment}`
      )
      .join('\n');
  }
  trimFragment(content) {
    const compact = content.replace(/\s+/g, ' ').trim();
    return compact.length > 320 ? `${compact.slice(0, 317)}...` : compact;
  }
};
exports.AiQueryService = AiQueryService;
exports.AiQueryService = AiQueryService = __decorate(
  [
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(document_entity_1.DocumentRecord)),
    __param(1, (0, typeorm_1.InjectRepository)(document_version_entity_1.DocumentVersion)),
    __param(2, (0, typeorm_1.InjectRepository)(document_chunk_entity_1.DocumentChunk)),
    __param(3, (0, typeorm_1.InjectRepository)(document_permission_entity_1.DocumentPermission)),
    __param(
      4,
      (0, typeorm_1.InjectRepository)(document_query_history_entity_1.DocumentQueryHistory)
    ),
    __param(5, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(6, (0, typeorm_1.InjectRepository)(project_member_entity_1.ProjectMember)),
    __metadata('design:paramtypes', [
      typeorm_2.Repository,
      typeorm_2.Repository,
      typeorm_2.Repository,
      typeorm_2.Repository,
      typeorm_2.Repository,
      typeorm_2.Repository,
      typeorm_2.Repository,
      access_scope_service_1.AccessScopeService,
      document_indexing_service_1.DocumentIndexingService,
      audit_service_1.AuditService,
    ]),
  ],
  AiQueryService
);
//# sourceMappingURL=ai-query.service.js.map
