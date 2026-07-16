"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const approval_request_entity_1 = require("../approvals/approval-request.entity");
const approval_step_entity_1 = require("../approvals/approval-step.entity");
const contract_obligation_entity_1 = require("../clm/contract-obligation.entity");
const contract_entity_1 = require("../clm/contract.entity");
const document_entity_1 = require("../documents/document.entity");
const rfi_entity_1 = require("../rfis/rfi.entity");
const user_entity_1 = require("../users/user.entity");
const notification_delivery_entity_1 = require("./notification-delivery.entity");
const notification_preference_entity_1 = require("./notification-preference.entity");
const notification_entity_1 = require("./notification.entity");
const notifications_controller_1 = require("./notifications.controller");
const notifications_scheduler_1 = require("./notifications.scheduler");
const notifications_service_1 = require("./notifications.service");
const smtp_mail_service_1 = require("./smtp-mail.service");
let NotificationsModule = class NotificationsModule {
};
exports.NotificationsModule = NotificationsModule;
exports.NotificationsModule = NotificationsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                notification_entity_1.Notification,
                notification_preference_entity_1.NotificationPreference,
                notification_delivery_entity_1.NotificationDelivery,
                user_entity_1.User,
                document_entity_1.DocumentRecord,
                approval_request_entity_1.ApprovalRequest,
                approval_step_entity_1.ApprovalStep,
                contract_entity_1.Contract,
                contract_obligation_entity_1.ContractObligation,
                rfi_entity_1.Rfi,
            ]),
        ],
        controllers: [notifications_controller_1.NotificationsController],
        providers: [notifications_service_1.NotificationsService, smtp_mail_service_1.SmtpMailService, notifications_scheduler_1.NotificationsScheduler],
        exports: [notifications_service_1.NotificationsService],
    })
], NotificationsModule);
//# sourceMappingURL=notifications.module.js.map