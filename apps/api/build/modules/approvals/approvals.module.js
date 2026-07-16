"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const notifications_module_1 = require("../notifications/notifications.module");
const projects_module_1 = require("../projects/projects.module");
const document_audit_log_entity_1 = require("../documents/document-audit-log.entity");
const document_entity_1 = require("../documents/document.entity");
const approval_flow_entity_1 = require("./approval-flow.entity");
const approval_request_action_entity_1 = require("./approval-request-action.entity");
const approval_request_entity_1 = require("./approval-request.entity");
const approval_step_entity_1 = require("./approval-step.entity");
const approvals_controller_1 = require("./approvals.controller");
const approvals_service_1 = require("./approvals.service");
let ApprovalsModule = class ApprovalsModule {
};
exports.ApprovalsModule = ApprovalsModule;
exports.ApprovalsModule = ApprovalsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            projects_module_1.ProjectsModule,
            notifications_module_1.NotificationsModule,
            typeorm_1.TypeOrmModule.forFeature([
                approval_flow_entity_1.ApprovalFlow,
                approval_step_entity_1.ApprovalStep,
                approval_request_entity_1.ApprovalRequest,
                approval_request_action_entity_1.ApprovalRequestAction,
                document_entity_1.DocumentRecord,
                document_audit_log_entity_1.DocumentAuditLog,
            ]),
        ],
        controllers: [approvals_controller_1.ApprovalsController],
        providers: [approvals_service_1.ApprovalsService],
        exports: [approvals_service_1.ApprovalsService],
    })
], ApprovalsModule);
//# sourceMappingURL=approvals.module.js.map