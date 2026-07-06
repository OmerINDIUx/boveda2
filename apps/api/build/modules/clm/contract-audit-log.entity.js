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
exports.ContractAuditLog = void 0;
const typeorm_1 = require("typeorm");
const contract_entity_1 = require("./contract.entity");
let ContractAuditLog = class ContractAuditLog {
    id;
    contractId;
    contract;
    actorId;
    action;
    beforeState;
    afterState;
    createdAt;
};
exports.ContractAuditLog = ContractAuditLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ContractAuditLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'contract_id' }),
    __metadata("design:type", String)
], ContractAuditLog.prototype, "contractId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => contract_entity_1.Contract, (contract) => contract.auditLogs),
    (0, typeorm_1.JoinColumn)({ name: 'contract_id' }),
    __metadata("design:type", contract_entity_1.Contract)
], ContractAuditLog.prototype, "contract", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'actor_id', nullable: true }),
    __metadata("design:type", String)
], ContractAuditLog.prototype, "actorId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], ContractAuditLog.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'before_state', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], ContractAuditLog.prototype, "beforeState", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'after_state', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], ContractAuditLog.prototype, "afterState", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ContractAuditLog.prototype, "createdAt", void 0);
exports.ContractAuditLog = ContractAuditLog = __decorate([
    (0, typeorm_1.Entity)('contract_audit_logs')
], ContractAuditLog);
//# sourceMappingURL=contract-audit-log.entity.js.map