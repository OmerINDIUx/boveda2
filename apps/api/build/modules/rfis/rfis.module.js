"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RfisModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const notifications_module_1 = require("../notifications/notifications.module");
const projects_module_1 = require("../projects/projects.module");
const user_entity_1 = require("../users/user.entity");
const storage_module_1 = require("../../storage/storage.module");
const rfi_attachment_entity_1 = require("./rfi-attachment.entity");
const rfi_comment_entity_1 = require("./rfi-comment.entity");
const rfi_history_entity_1 = require("./rfi-history.entity");
const rfi_template_entity_1 = require("./rfi-template.entity");
const rfi_entity_1 = require("./rfi.entity");
const rfis_controller_1 = require("./rfis.controller");
const rfis_service_1 = require("./rfis.service");
let RfisModule = class RfisModule {
};
exports.RfisModule = RfisModule;
exports.RfisModule = RfisModule = __decorate([
    (0, common_1.Module)({
        imports: [
            projects_module_1.ProjectsModule,
            notifications_module_1.NotificationsModule,
            storage_module_1.StorageModule,
            typeorm_1.TypeOrmModule.forFeature([rfi_entity_1.Rfi, rfi_comment_entity_1.RfiComment, rfi_attachment_entity_1.RfiAttachment, rfi_history_entity_1.RfiHistory, rfi_template_entity_1.RfiTemplate, user_entity_1.User]),
        ],
        controllers: [rfis_controller_1.RfisController],
        providers: [rfis_service_1.RfisService],
    })
], RfisModule);
//# sourceMappingURL=rfis.module.js.map