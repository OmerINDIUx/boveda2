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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentVersion = void 0;
const typeorm_1 = require("typeorm");
const document_entity_1 = require("../documents/document.entity");
const user_entity_1 = require("../users/user.entity");
let DocumentVersion = class DocumentVersion {
    id;
    documentId;
    document;
    revision;
    fileKey;
    fileName;
    fileExtension;
    mimeType;
    sizeBytes;
    uploadedById;
    uploadedBy;
    checksum;
    notes;
    contentHash;
    contentExtractionStatus;
    contentExtractionError;
    contentExtractedAt;
    createdAt;
    deletedAt;
};
exports.DocumentVersion = DocumentVersion;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DocumentVersion.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'document_id' }),
    __metadata("design:type", String)
], DocumentVersion.prototype, "documentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => document_entity_1.DocumentRecord),
    (0, typeorm_1.JoinColumn)({ name: 'document_id' }),
    __metadata("design:type", document_entity_1.DocumentRecord)
], DocumentVersion.prototype, "document", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 40 }),
    __metadata("design:type", String)
], DocumentVersion.prototype, "revision", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_key' }),
    __metadata("design:type", String)
], DocumentVersion.prototype, "fileKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_name' }),
    __metadata("design:type", String)
], DocumentVersion.prototype, "fileName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_extension', length: 30, nullable: true }),
    __metadata("design:type", String)
], DocumentVersion.prototype, "fileExtension", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mime_type', length: 120 }),
    __metadata("design:type", String)
], DocumentVersion.prototype, "mimeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'size_bytes', type: 'bigint' }),
    __metadata("design:type", Number)
], DocumentVersion.prototype, "sizeBytes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'uploaded_by_id' }),
    __metadata("design:type", String)
], DocumentVersion.prototype, "uploadedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'uploaded_by_id' }),
    __metadata("design:type", user_entity_1.User)
], DocumentVersion.prototype, "uploadedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 128, nullable: true }),
    __metadata("design:type", String)
], DocumentVersion.prototype, "checksum", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], DocumentVersion.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'content_hash', length: 128, nullable: true }),
    __metadata("design:type", String)
], DocumentVersion.prototype, "contentHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'content_extraction_status', length: 40, default: 'pending' }),
    __metadata("design:type", String)
], DocumentVersion.prototype, "contentExtractionStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'content_extraction_error', type: 'text', nullable: true }),
    __metadata("design:type", String)
], DocumentVersion.prototype, "contentExtractionError", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'content_extracted_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], DocumentVersion.prototype, "contentExtractedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], DocumentVersion.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Date)
], DocumentVersion.prototype, "deletedAt", void 0);
exports.DocumentVersion = DocumentVersion = __decorate([
    (0, typeorm_1.Entity)('document_versions')
], DocumentVersion);
//# sourceMappingURL=document-version.entity.js.map