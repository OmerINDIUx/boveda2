"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiQueryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const access_scope_service_1 = require("../../common/access-scope.service");
const audit_service_1 = require("../audit/audit.service");
const document_chunk_entity_1 = require("../documents/document-chunk.entity");
const document_permission_entity_1 = require("../documents/document-permission.entity");
const document_entity_1 = require("../documents/document.entity");
const project_member_entity_1 = require("../projects/project-member.entity");
const user_entity_1 = require("../users/user.entity");
const document_version_entity_1 = require("../versions/document-version.entity");
const document_indexing_service_1 = require("./document-indexing.service");
const document_query_history_entity_1 = require("./document-query-history.entity");
const ollama_chat_service_1 = require("./ollama-chat.service");
const conversation_session_entity_1 = require("./conversation-session.entity");
let AiQueryService = class AiQueryService {
    documents;
    versions;
    chunks;
    permissions;
    history;
    users;
    members;
    sessions;
    scope;
    indexing;
    ollama;
    audit;
    constructor(documents, versions, chunks, permissions, history, users, members, sessions, scope, indexing, ollama, audit) {
        this.documents = documents;
        this.versions = versions;
        this.chunks = chunks;
        this.permissions = permissions;
        this.history = history;
        this.users = users;
        this.members = members;
        this.sessions = sessions;
        this.scope = scope;
        this.indexing = indexing;
        this.ollama = ollama;
        this.audit = audit;
    }
    async createSession(userId, dto) {
        const session = this.sessions.create({
            userId,
            name: dto.name,
            projectId: dto.projectId,
            documentId: dto.documentId,
        });
        return this.sessions.save(session);
    }
    async listSessions(userId) {
        return this.sessions.find({
            where: { userId, active: true },
            order: { updatedAt: 'DESC' },
            take: 50,
        });
    }
    async getSession(userId, sessionId) {
        const session = await this.sessions.findOne({ where: { id: sessionId, userId } });
        if (!session) {
            throw new common_1.NotFoundException('Sesion no encontrada');
        }
        return session;
    }
    async deleteSession(userId, sessionId) {
        const session = await this.getSession(userId, sessionId);
        session.active = false;
        await this.sessions.save(session);
        return { ok: true };
    }
    async ask(userId, dto) {
        const visibleDocuments = await this.getVisibleDocuments(userId, dto);
        const response = await this.buildGroundedResponse(visibleDocuments, dto.question);
        const session = dto.sessionId
            ? await this.sessions.findOne({ where: { id: dto.sessionId, userId } })
            : null;
        if (dto.sessionId && !session) {
            throw new common_1.NotFoundException('Sesion no encontrada');
        }
        const historyEntry = await this.history.save(this.history.create({
            userId,
            sessionId: dto.sessionId,
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
        }));
        await this.audit.record({
            actorId: userId,
            action: 'ai_query.ask',
            entityType: 'document_query',
            entityId: historyEntry.id,
            metadata: {
                sessionId: dto.sessionId,
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
    async historyForUser(userId, sessionId) {
        const where = { userId };
        if (sessionId) {
            where.sessionId = sessionId;
        }
        return this.history.find({
            where,
            order: { createdAt: 'DESC' },
            take: 50,
        });
    }
    async indexingStatus() {
        const docsWithVersions = await this.documents.find({
            where: { currentVersionId: (0, typeorm_2.Not)((0, typeorm_2.IsNull)()) },
            select: { id: true, currentVersionId: true },
        });
        let indexedCount = 0;
        for (const doc of docsWithVersions) {
            if (!doc.currentVersionId)
                continue;
            const count = await this.chunks.count({
                where: { documentId: doc.id, versionId: doc.currentVersionId },
            });
            if (count > 0)
                indexedCount++;
        }
        return {
            totalDocuments: docsWithVersions.length,
            indexedDocuments: indexedCount,
            pendingDocuments: docsWithVersions.length - indexedCount,
        };
    }
    async documentAnalysis(userId, documentId) {
        const [document] = await this.getVisibleDocuments(userId, { documentId, question: '' });
        if (!document)
            throw new common_1.NotFoundException('Documento no encontrado dentro del alcance del usuario');
        const version = document.currentVersionId
            ? await this.versions.findOne({ where: { id: document.currentVersionId } })
            : null;
        if (!version) {
            return { document: { id: document.id, name: document.name, documentNumber: document.documentNumber }, version: null, status: 'pending', transcription: [], indexItems: [] };
        }
        const chunks = await this.chunks.find({ where: { documentId, versionId: version.id }, order: { chunkIndex: 'ASC' } });
        return {
            document: { id: document.id, name: document.name, documentNumber: document.documentNumber },
            version: { id: version.id, revision: version.revision, fileName: version.fileName, extractedAt: version.contentExtractedAt },
            status: version.contentExtractionStatus,
            error: version.contentExtractionError,
            transcription: chunks.map((chunk) => ({ id: chunk.id, pageNumber: chunk.pageNumber, sectionLabel: chunk.sectionLabel, text: chunk.content.trim() })),
            indexItems: [],
        };
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
            throw new common_1.NotFoundException('Documento no encontrado dentro del alcance del usuario');
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
                return (row.userId === userId ||
                    (row.roleId ? roleIds.includes(row.roleId) : false) ||
                    (row.projectUserId ? projectUserIds.includes(row.projectUserId) : false));
            });
        });
    }
    async buildGroundedResponse(visibleDocuments, question) {
        if (!visibleDocuments.length) {
            return {
                status: 'insufficient_information',
                answer: 'No hay documentos autorizados dentro del alcance actual para responder esta consulta.',
                citations: [],
            };
        }
        const currentVersionIds = visibleDocuments
            .map((document) => document.currentVersionId)
            .filter((value) => Boolean(value));
        if (!currentVersionIds.length) {
            return {
                status: 'insufficient_information',
                answer: 'Los documentos autorizados aun no tienen una version indexable para responder esta consulta.',
                citations: [],
            };
        }
        const currentVersions = await this.versions.find({
            where: { id: (0, typeorm_2.In)(currentVersionIds) },
        });
        const versionsById = new Map(currentVersions.map((version) => [version.id, version]));
        const indexedDocuments = [];
        const skippedDocuments = [];
        for (const document of visibleDocuments) {
            if (!document.currentVersionId)
                continue;
            const version = versionsById.get(document.currentVersionId);
            if (!version)
                continue;
            if (version.contentExtractionStatus !== 'completed') {
                skippedDocuments.push({
                    name: document.name,
                    reason: 'En proceso de indexacion. Intenta de nuevo en unos minutos.',
                });
                continue;
            }
            const chunkCount = await this.chunks.count({
                where: { documentId: document.id, versionId: document.currentVersionId },
            });
            if (chunkCount === 0) {
                skippedDocuments.push({
                    name: document.name,
                    reason: 'El contenido del documento esta siendo procesado.',
                });
                continue;
            }
            indexedDocuments.push(document);
        }
        if (!indexedDocuments.length) {
            return {
                status: 'insufficient_information',
                answer: this.composeSkippedDocumentsMessage(skippedDocuments, 'Los documentos autorizados aun no estan disponibles para consulta. El proceso de indexacion puede tardar unos minutos.'),
                citations: [],
            };
        }
        const searchResults = await this.indexing.searchVisibleChunks(indexedDocuments.map((document) => document.id), question);
        if (!searchResults.length) {
            return {
                status: 'insufficient_information',
                answer: this.composeSkippedDocumentsMessage(skippedDocuments, 'No encontre informacion suficiente en los documentos autorizados para responder con seguridad. Intenta reformular la pregunta o acotarla a un documento especifico.'),
                citations: [],
            };
        }
        const citedChunks = await this.toCitations(searchResults, indexedDocuments, versionsById);
        const llmAnswer = await this.ollama.answer(question, citedChunks);
        if (!llmAnswer.answer) {
            return {
                status: 'insufficient_information',
                answer: this.composeSkippedDocumentsMessage(skippedDocuments, llmAnswer.error ?? 'No pude generar una respuesta con el modelo local.'),
                citations: citedChunks,
            };
        }
        return {
            status: 'answered',
            answer: this.composeSkippedDocumentsMessage(skippedDocuments, llmAnswer.answer),
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
    trimFragment(content) {
        const compact = content.replace(/\s+/g, ' ').trim();
        return compact.length > 320 ? `${compact.slice(0, 317)}...` : compact;
    }
    composeSkippedDocumentsMessage(skippedDocuments, baseMessage) {
        if (!skippedDocuments.length) {
            return baseMessage;
        }
        const names = skippedDocuments.map((item) => item.name).join(', ');
        return `${baseMessage}\n\nSe omitieron temporalmente estos documentos por un problema de extraccion o indexacion: ${names}.`;
    }
};
exports.AiQueryService = AiQueryService;
exports.AiQueryService = AiQueryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(document_entity_1.DocumentRecord)),
    __param(1, (0, typeorm_1.InjectRepository)(document_version_entity_1.DocumentVersion)),
    __param(2, (0, typeorm_1.InjectRepository)(document_chunk_entity_1.DocumentChunk)),
    __param(3, (0, typeorm_1.InjectRepository)(document_permission_entity_1.DocumentPermission)),
    __param(4, (0, typeorm_1.InjectRepository)(document_query_history_entity_1.DocumentQueryHistory)),
    __param(5, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(6, (0, typeorm_1.InjectRepository)(project_member_entity_1.ProjectMember)),
    __param(7, (0, typeorm_1.InjectRepository)(conversation_session_entity_1.ConversationSession)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        access_scope_service_1.AccessScopeService,
        document_indexing_service_1.DocumentIndexingService,
        ollama_chat_service_1.OllamaChatService,
        audit_service_1.AuditService])
], AiQueryService);
//# sourceMappingURL=ai-query.service.js.map
