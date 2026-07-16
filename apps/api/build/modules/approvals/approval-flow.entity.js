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
exports.ApprovalFlow = void 0;
const typeorm_1 = require("typeorm");
const approval_step_entity_1 = require("./approval-step.entity");
let ApprovalFlow = class ApprovalFlow {
    id;
    projectId;
    name;
    entityType;
    scopeType;
    targetDocumentId;
    requireForPublication;
    active;
    createdById;
    steps;
    createdAt;
    updatedAt;
    deletedAt;
};
exports.ApprovalFlow = ApprovalFlow;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ApprovalFlow.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_id' }),
    __metadata("design:type", String)
], ApprovalFlow.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 160 }),
    __metadata("design:type", String)
], ApprovalFlow.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'entity_type', length: 80 }),
    __metadata("design:type", String)
], ApprovalFlow.prototype, "entityType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'scope_type', length: 40, default: 'global' }),
    __metadata("design:type", String)
], ApprovalFlow.prototype, "scopeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'target_document_id', nullable: true }),
    __metadata("design:type", String)
], ApprovalFlow.prototype, "targetDocumentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'require_for_publication', default: true }),
    __metadata("design:type", Boolean)
], ApprovalFlow.prototype, "requireForPublication", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], ApprovalFlow.prototype, "active", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by_id', nullable: true }),
    __metadata("design:type", String)
], ApprovalFlow.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => approval_step_entity_1.ApprovalStep, (step) => step.workflow),
    __metadata("design:type", Array)
], ApprovalFlow.prototype, "steps", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ApprovalFlow.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ApprovalFlow.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Date)
], ApprovalFlow.prototype, "deletedAt", void 0);
exports.ApprovalFlow = ApprovalFlow = __decorate([
    (0, typeorm_1.Entity)('approval_workflows')
], ApprovalFlow);
//# sourceMappingURL=approval-flow.entity.js.map