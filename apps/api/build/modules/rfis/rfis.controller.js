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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RfisController = void 0;
const common_1 = require("@nestjs/common");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const active_user_guard_1 = require("../../common/guards/active-user.guard");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_1 = require("../../common/permissions");
const create_rfi_comment_dto_1 = require("./dto/create-rfi-comment.dto");
const create_rfi_dto_1 = require("./dto/create-rfi.dto");
const create_rfi_template_dto_1 = require("./dto/create-rfi-template.dto");
const inbound_email_dto_1 = require("./dto/inbound-email.dto");
const respond_rfi_dto_1 = require("./dto/respond-rfi.dto");
const rfi_list_query_dto_1 = require("./dto/rfi-list-query.dto");
const update_rfi_status_dto_1 = require("./dto/update-rfi-status.dto");
const update_rfi_template_dto_1 = require("./dto/update-rfi-template.dto");
const rfis_service_1 = require("./rfis.service");
let RfisController = class RfisController {
    rfis;
    constructor(rfis) {
        this.rfis = rfis;
    }
    listTemplates(user, projectId) {
        return this.rfis.listTemplates(user, projectId);
    }
    getTemplate(user, id) {
        return this.rfis.getTemplate(user, id);
    }
    createTemplate(user, dto) {
        return this.rfis.createTemplate(user, dto);
    }
    updateTemplate(user, id, dto) {
        return this.rfis.updateTemplate(user, id, dto);
    }
    deleteTemplate(user, id) {
        return this.rfis.deleteTemplate(user, id);
    }
    evaluateTemplate(user, id, projectId) {
        return this.rfis.evaluateTemplate(user, id, projectId);
    }
    inboundEmail(dto, apiKey) {
        const expectedKey = process.env.INBOUND_API_KEY;
        if (expectedKey && apiKey !== expectedKey) {
            return { ok: false, reason: 'API key inválida' };
        }
        return this.rfis.processInboundEmail(dto);
    }
    formOptions(user, projectId) {
        return this.rfis.getFormOptions(user, projectId);
    }
    list(user, query) {
        return this.rfis.list(user, query);
    }
    detail(user, id) {
        return this.rfis.getDetail(user, id);
    }
    create(user, dto) {
        return this.rfis.create(user, dto);
    }
    comment(user, id, dto) {
        return this.rfis.addComment(user, id, dto);
    }
    respond(user, id, dto) {
        return this.rfis.respond(user, id, dto);
    }
    updateStatus(user, id, dto) {
        return this.rfis.updateStatus(user, id, dto);
    }
    close(user, id, note) {
        return this.rfis.close(user, id, note);
    }
};
exports.RfisController = RfisController;
__decorate([
    (0, common_1.Get)('templates'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RfisController.prototype, "listTemplates", null);
__decorate([
    (0, common_1.Get)('templates/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RfisController.prototype, "getTemplate", null);
__decorate([
    (0, common_1.Post)('templates'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_rfi_template_dto_1.CreateRfiTemplateDto]),
    __metadata("design:returntype", void 0)
], RfisController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.Patch)('templates/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_rfi_template_dto_1.UpdateRfiTemplateDto]),
    __metadata("design:returntype", void 0)
], RfisController.prototype, "updateTemplate", null);
__decorate([
    (0, common_1.Delete)('templates/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RfisController.prototype, "deleteTemplate", null);
__decorate([
    (0, common_1.Post)('templates/:id/evaluate'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], RfisController.prototype, "evaluateTemplate", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('inbound-email'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('x-api-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inbound_email_dto_1.InboundEmailDto, String]),
    __metadata("design:returntype", void 0)
], RfisController.prototype, "inboundEmail", null);
__decorate([
    (0, common_1.Get)('form-options'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RfisController.prototype, "formOptions", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, rfi_list_query_dto_1.RfiListQueryDto]),
    __metadata("design:returntype", void 0)
], RfisController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RfisController.prototype, "detail", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_rfi_dto_1.CreateRfiDto]),
    __metadata("design:returntype", void 0)
], RfisController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/comments'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_rfi_comment_dto_1.CreateRfiCommentDto]),
    __metadata("design:returntype", void 0)
], RfisController.prototype, "comment", null);
__decorate([
    (0, common_1.Post)(':id/respond'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, respond_rfi_dto_1.RespondRfiDto]),
    __metadata("design:returntype", void 0)
], RfisController.prototype, "respond", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_rfi_status_dto_1.UpdateRfiStatusDto]),
    __metadata("design:returntype", void 0)
], RfisController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id/close'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('note')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], RfisController.prototype, "close", null);
exports.RfisController = RfisController = __decorate([
    (0, swagger_1.ApiTags)('rfis'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, active_user_guard_1.ActiveUserGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.RfisManage),
    (0, common_1.Controller)('rfis'),
    __metadata("design:paramtypes", [rfis_service_1.RfisService])
], RfisController);
//# sourceMappingURL=rfis.controller.js.map