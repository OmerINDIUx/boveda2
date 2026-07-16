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
const contract_amendment_entity_1 = require("./entities/contract-amendment.entity");
const contract_attachment_entity_1 = require("./contract-attachment.entity");
const contract_audit_log_entity_1 = require("./contract-audit-log.entity");
const contract_clause_entity_1 = require("./entities/contract-clause.entity");
const contract_comment_entity_1 = require("./contract-comment.entity");
const contract_custom_field_entity_1 = require("./entities/contract-custom-field.entity");
const contract_custom_value_entity_1 = require("./entities/contract-custom-value.entity");
const contract_import_log_entity_1 = require("./entities/contract-import-log.entity");
const contract_entity_1 = require("./contract.entity");
const contract_milestone_entity_1 = require("./contract-milestone.entity");
const contract_negotiation_entity_1 = require("./entities/contract-negotiation.entity");
const contract_obligation_entity_1 = require("./contract-obligation.entity");
const contract_payment_entity_1 = require("./entities/contract-payment.entity");
const contract_signature_request_entity_1 = require("./entities/contract-signature-request.entity");
const contract_template_entity_1 = require("./entities/contract-template.entity");
const contract_version_entity_1 = require("./contract-version.entity");
const tag_entity_1 = require("./entities/tag.entity");
const document_version_entity_1 = require("../versions/document-version.entity");
const report_generator_service_1 = require("./reports/report-generator.service");
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
                contract_amendment_entity_1.ContractAmendment,
                contract_payment_entity_1.ContractPayment,
                contract_signature_request_entity_1.ContractSignatureRequest,
                contract_negotiation_entity_1.ContractNegotiation,
                contract_template_entity_1.ContractTemplate,
                contract_clause_entity_1.ContractClause,
                contract_custom_field_entity_1.ContractCustomField,
                contract_custom_value_entity_1.ContractCustomValue,
                contract_import_log_entity_1.ContractImportLog,
                tag_entity_1.Tag,
                document_entity_1.DocumentRecord,
                document_version_entity_1.DocumentVersion,
            ]),
        ],
        controllers: [clm_controller_1.ClmController],
        providers: [clm_service_1.ClmService, report_generator_service_1.ReportGeneratorService],
        exports: [clm_service_1.ClmService],
    })
], ClmModule);
//# sourceMappingURL=clm.module.js.map