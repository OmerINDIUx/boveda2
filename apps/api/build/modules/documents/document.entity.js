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
exports.DocumentRecord = void 0;
const typeorm_1 = require("typeorm");
const discipline_entity_1 = require("../folders/discipline.entity");
const folder_entity_1 = require("../folders/folder.entity");
const project_entity_1 = require("../projects/project.entity");
const user_entity_1 = require("../users/user.entity");
const document_audit_log_entity_1 = require("./document-audit-log.entity");
const document_comment_entity_1 = require("./document-comment.entity");
const document_metadata_entity_1 = require("./document-metadata.entity");
const document_permission_entity_1 = require("./document-permission.entity");
let DocumentRecord = class DocumentRecord {
    id;
    projectId;
    project;
    folderId;
    folder;
    disciplineId;
    discipline;
    name;
    documentNumber;
    status;
    confidentialityLevel;
    responsibleUserId;
    responsibleUser;
    currentVersionId;
    dueDate;
    renewable;
    originalFileKey;
    fileExtension;
    sizeBytes;
    uploadedById;
    uploadedBy;
    metadata;
    permissions;
    auditLogs;
    comments;
    createdAt;
    updatedAt;
    deletedAt;
};
exports.DocumentRecord = DocumentRecord;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DocumentRecord.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_id' }),
    __metadata("design:type", String)
], DocumentRecord.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project),
    (0, typeorm_1.JoinColumn)({ name: 'project_id' }),
    __metadata("design:type", project_entity_1.Project)
], DocumentRecord.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'folder_id', nullable: true }),
    __metadata("design:type", String)
], DocumentRecord.prototype, "folderId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => folder_entity_1.Folder),
    (0, typeorm_1.JoinColumn)({ name: 'folder_id' }),
    __metadata("design:type", folder_entity_1.Folder)
], DocumentRecord.prototype, "folder", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'discipline_id', nullable: true }),
    __metadata("design:type", String)
], DocumentRecord.prototype, "disciplineId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => discipline_entity_1.Discipline),
    (0, typeorm_1.JoinColumn)({ name: 'discipline_id' }),
    __metadata("design:type", discipline_entity_1.Discipline)
], DocumentRecord.prototype, "discipline", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 220 }),
    __metadata("design:type", String)
], DocumentRecord.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'document_number', length: 80 }),
    __metadata("design:type", String)
], DocumentRecord.prototype, "documentNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'draft' }),
    __metadata("design:type", String)
], DocumentRecord.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'confidentiality_level', default: 'internal' }),
    __metadata("design:type", String)
], DocumentRecord.prototype, "confidentialityLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'responsible_user_id', nullable: true }),
    __metadata("design:type", String)
], DocumentRecord.prototype, "responsibleUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'responsible_user_id' }),
    __metadata("design:type", user_entity_1.User)
], DocumentRecord.prototype, "responsibleUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'current_version_id', nullable: true }),
    __metadata("design:type", String)
], DocumentRecord.prototype, "currentVersionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'due_date', type: 'date', nullable: true }),
    __metadata("design:type", String)
], DocumentRecord.prototype, "dueDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], DocumentRecord.prototype, "renewable", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'original_file_key', nullable: true }),
    __metadata("design:type", String)
], DocumentRecord.prototype, "originalFileKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_extension', length: 30, nullable: true }),
    __metadata("design:type", String)
], DocumentRecord.prototype, "fileExtension", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'size_bytes', type: 'bigint', nullable: true }),
    __metadata("design:type", Number)
], DocumentRecord.prototype, "sizeBytes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'uploaded_by_id' }),
    __metadata("design:type", String)
], DocumentRecord.prototype, "uploadedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'uploaded_by_id' }),
    __metadata("design:type", user_entity_1.User)
], DocumentRecord.prototype, "uploadedBy", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => document_metadata_entity_1.DocumentMetadata, (metadata) => metadata.document),
    __metadata("design:type", Array)
], DocumentRecord.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => document_permission_entity_1.DocumentPermission, (permission) => permission.document),
    __metadata("design:type", Array)
], DocumentRecord.prototype, "permissions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => document_audit_log_entity_1.DocumentAuditLog, (log) => log.document),
    __metadata("design:type", Array)
], DocumentRecord.prototype, "auditLogs", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => document_comment_entity_1.DocumentComment, (comment) => comment.document),
    __metadata("design:type", Array)
], DocumentRecord.prototype, "comments", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], DocumentRecord.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], DocumentRecord.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Date)
], DocumentRecord.prototype, "deletedAt", void 0);
exports.DocumentRecord = DocumentRecord = __decorate([
    (0, typeorm_1.Entity)('documents')
], DocumentRecord);
//# sourceMappingURL=document.entity.js.map