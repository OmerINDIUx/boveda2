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
exports.DocumentAuditLog = void 0;
const typeorm_1 = require("typeorm");
const document_entity_1 = require("./document.entity");
let DocumentAuditLog = class DocumentAuditLog {
    id;
    documentId;
    document;
    actorId;
    action;
    beforeState;
    afterState;
    ipAddress;
    userAgent;
    createdAt;
};
exports.DocumentAuditLog = DocumentAuditLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], DocumentAuditLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'document_id' }),
    __metadata("design:type", String)
], DocumentAuditLog.prototype, "documentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => document_entity_1.DocumentRecord, (document) => document.auditLogs),
    (0, typeorm_1.JoinColumn)({ name: 'document_id' }),
    __metadata("design:type", document_entity_1.DocumentRecord)
], DocumentAuditLog.prototype, "document", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'actor_id', nullable: true }),
    __metadata("design:type", String)
], DocumentAuditLog.prototype, "actorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], DocumentAuditLog.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'before_state', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], DocumentAuditLog.prototype, "beforeState", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'after_state', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], DocumentAuditLog.prototype, "afterState", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ip_address', length: 45, nullable: true }),
    __metadata("design:type", String)
], DocumentAuditLog.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_agent', length: 255, nullable: true }),
    __metadata("design:type", String)
], DocumentAuditLog.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], DocumentAuditLog.prototype, "createdAt", void 0);
exports.DocumentAuditLog = DocumentAuditLog = __decorate([
    (0, typeorm_1.Entity)('document_audit_logs')
], DocumentAuditLog);
//# sourceMappingURL=document-audit-log.entity.js.map