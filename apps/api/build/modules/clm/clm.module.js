"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClmModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const storage_module_1 = require("../../storage/storage.module");
const document_entity_1 = require("../documents/document.entity");
const notifications_module_1 = require("../notifications/notifications.module");
const projects_module_1 = require("../projects/projects.module");
const clm_controller_1 = require("./clm.controller");
const clm_service_1 = require("./clm.service");
const contract_attachment_entity_1 = require("./contract-attachment.entity");
const contract_audit_log_entity_1 = require("./contract-audit-log.entity");
const contract_comment_entity_1 = require("./contract-comment.entity");
const contract_entity_1 = require("./contract.entity");
const contract_milestone_entity_1 = require("./contract-milestone.entity");
const contract_obligation_entity_1 = require("./contract-obligation.entity");
const contract_version_entity_1 = require("./contract-version.entity");
const document_version_entity_1 = require("../versions/document-version.entity");
let ClmModule = class ClmModule {
};
exports.ClmModule = ClmModule;
exports.ClmModule = ClmModule = __decorate([
    (0, common_1.Module)({
        imports: [
            projects_module_1.ProjectsModule,
            storage_module_1.StorageModule,
            notifications_module_1.NotificationsModule,
            typeorm_1.TypeOrmModule.forFeature([
                contract_entity_1.Contract,
                contract_version_entity_1.ContractVersion,
                contract_attachment_entity_1.ContractAttachment,
                contract_obligation_entity_1.ContractObligation,
                contract_milestone_entity_1.ContractMilestone,
                contract_comment_entity_1.ContractComment,
                contract_audit_log_entity_1.ContractAuditLog,
                document_entity_1.DocumentRecord,
                document_version_entity_1.DocumentVersion
            ])
        ],
        controllers: [clm_controller_1.ClmController],
        providers: [clm_service_1.ClmService]
    })
], ClmModule);
//# sourceMappingURL=clm.module.js.map