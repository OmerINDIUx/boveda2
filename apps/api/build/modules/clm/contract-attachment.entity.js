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
exports.ContractAttachment = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const contract_entity_1 = require("./contract.entity");
let ContractAttachment = class ContractAttachment {
    id;
    contractId;
    contract;
    name;
    fileKey;
    fileName;
    fileExtension;
    mimeType;
    sizeBytes;
    uploadedById;
    uploadedBy;
    notes;
    createdAt;
    deletedAt;
};
exports.ContractAttachment = ContractAttachment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ContractAttachment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contract_id' }),
    __metadata("design:type", String)
], ContractAttachment.prototype, "contractId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => contract_entity_1.Contract, (contract) => contract.attachments),
    (0, typeorm_1.JoinColumn)({ name: 'contract_id' }),
    __metadata("design:type", contract_entity_1.Contract)
], ContractAttachment.prototype, "contract", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 180 }),
    __metadata("design:type", String)
], ContractAttachment.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_key' }),
    __metadata("design:type", String)
], ContractAttachment.prototype, "fileKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_name' }),
    __metadata("design:type", String)
], ContractAttachment.prototype, "fileName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_extension', length: 30, nullable: true }),
    __metadata("design:type", String)
], ContractAttachment.prototype, "fileExtension", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mime_type', length: 120 }),
    __metadata("design:type", String)
], ContractAttachment.prototype, "mimeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'size_bytes', type: 'bigint' }),
    __metadata("design:type", Number)
], ContractAttachment.prototype, "sizeBytes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'uploaded_by_id' }),
    __metadata("design:type", String)
], ContractAttachment.prototype, "uploadedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'uploaded_by_id' }),
    __metadata("design:type", user_entity_1.User)
], ContractAttachment.prototype, "uploadedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ContractAttachment.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ContractAttachment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Date)
], ContractAttachment.prototype, "deletedAt", void 0);
exports.ContractAttachment = ContractAttachment = __decorate([
    (0, typeorm_1.Entity)('contract_attachments')
], ContractAttachment);
//# sourceMappingURL=contract-attachment.entity.js.map