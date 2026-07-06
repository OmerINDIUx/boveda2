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
exports.ClmController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const active_user_guard_1 = require("../../common/guards/active-user.guard");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_1 = require("../../common/permissions");
const ask_contract_query_dto_1 = require("./dto/ask-contract-query.dto");
const close_contract_dto_1 = require("./dto/close-contract.dto");
const create_contract_attachment_dto_1 = require("./dto/create-contract-attachment.dto");
const create_contract_comment_dto_1 = require("./dto/create-contract-comment.dto");
const create_contract_dto_1 = require("./dto/create-contract.dto");
const create_contract_milestone_dto_1 = require("./dto/create-contract-milestone.dto");
const create_contract_obligation_dto_1 = require("./dto/create-contract-obligation.dto");
const create_contract_version_dto_1 = require("./dto/create-contract-version.dto");
const renew_contract_dto_1 = require("./dto/renew-contract.dto");
const update_contract_milestone_dto_1 = require("./dto/update-contract-milestone.dto");
const update_contract_obligation_dto_1 = require("./dto/update-contract-obligation.dto");
const update_contract_dto_1 = require("./dto/update-contract.dto");
const clm_service_1 = require("./clm.service");
let ClmController = class ClmController {
    clm;
    constructor(clm) {
        this.clm = clm;
    }
    list(user, projectId) {
        return this.clm.list(user.id, projectId);
    }
    create(user, dto) {
        return this.clm.create(user.id, dto);
    }
    detail(user, id) {
        return this.clm.getDetail(user.id, id);
    }
    update(user, id, dto) {
        return this.clm.update(user.id, id, dto);
    }
    createVersion(user, id, dto) {
        return this.clm.createVersion(user.id, id, dto);
    }
    addAttachment(user, id, dto) {
        return this.clm.addAttachment(user.id, id, dto);
    }
    addObligation(user, id, dto) {
        return this.clm.addObligation(user.id, id, dto);
    }
    updateObligation(user, id, obligationId, dto) {
        return this.clm.updateObligation(user.id, id, obligationId, dto);
    }
    addMilestone(user, id, dto) {
        return this.clm.addMilestone(user.id, id, dto);
    }
    updateMilestone(user, id, milestoneId, dto) {
        return this.clm.updateMilestone(user.id, id, milestoneId, dto);
    }
    addComment(user, id, dto) {
        return this.clm.addComment(user.id, id, dto);
    }
    close(user, id, dto) {
        return this.clm.close(user.id, id, dto);
    }
    renew(user, id, dto) {
        return this.clm.renew(user.id, id, dto);
    }
    ask(user, id, dto) {
        return this.clm.ask(user.id, id, dto);
    }
    syncAlerts(user, projectId) {
        return this.clm.synchronizeAlerts(user.id, projectId);
    }
};
exports.ClmController = ClmController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.ContractsManage),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ClmController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.ContractsManage),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_contract_dto_1.CreateContractDto]),
    __metadata("design:returntype", void 0)
], ClmController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.ContractsManage),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ClmController.prototype, "detail", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.ContractsManage),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_contract_dto_1.UpdateContractDto]),
    __metadata("design:returntype", void 0)
], ClmController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/versions'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.ContractsManage),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_contract_version_dto_1.CreateContractVersionDto]),
    __metadata("design:returntype", void 0)
], ClmController.prototype, "createVersion", null);
__decorate([
    (0, common_1.Post)(':id/attachments'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.ContractsManage),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_contract_attachment_dto_1.CreateContractAttachmentDto]),
    __metadata("design:returntype", void 0)
], ClmController.prototype, "addAttachment", null);
__decorate([
    (0, common_1.Post)(':id/obligations'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.ContractsManage),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_contract_obligation_dto_1.CreateContractObligationDto]),
    __metadata("design:returntype", void 0)
], ClmController.prototype, "addObligation", null);
__decorate([
    (0, common_1.Patch)(':id/obligations/:obligationId'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.ContractsManage),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('obligationId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, update_contract_obligation_dto_1.UpdateContractObligationDto]),
    __metadata("design:returntype", void 0)
], ClmController.prototype, "updateObligation", null);
__decorate([
    (0, common_1.Post)(':id/milestones'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.ContractsManage),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_contract_milestone_dto_1.CreateContractMilestoneDto]),
    __metadata("design:returntype", void 0)
], ClmController.prototype, "addMilestone", null);
__decorate([
    (0, common_1.Patch)(':id/milestones/:milestoneId'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.ContractsManage),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('milestoneId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, update_contract_milestone_dto_1.UpdateContractMilestoneDto]),
    __metadata("design:returntype", void 0)
], ClmController.prototype, "updateMilestone", null);
__decorate([
    (0, common_1.Post)(':id/comments'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.ContractsManage),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_contract_comment_dto_1.CreateContractCommentDto]),
    __metadata("design:returntype", void 0)
], ClmController.prototype, "addComment", null);
__decorate([
    (0, common_1.Post)(':id/close'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.ContractsManage),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, close_contract_dto_1.CloseContractDto]),
    __metadata("design:returntype", void 0)
], ClmController.prototype, "close", null);
__decorate([
    (0, common_1.Post)(':id/renew'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.ContractsManage),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, renew_contract_dto_1.RenewContractDto]),
    __metadata("design:returntype", void 0)
], ClmController.prototype, "renew", null);
__decorate([
    (0, common_1.Post)(':id/ask'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.ContractsManage),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, ask_contract_query_dto_1.AskContractQueryDto]),
    __metadata("design:returntype", void 0)
], ClmController.prototype, "ask", null);
__decorate([
    (0, common_1.Post)('alerts/sync'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.ContractsManage),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ClmController.prototype, "syncAlerts", null);
exports.ClmController = ClmController = __decorate([
    (0, swagger_1.ApiTags)('clm'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, active_user_guard_1.ActiveUserGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('clm/contracts'),
    __metadata("design:paramtypes", [clm_service_1.ClmService])
], ClmController);
//# sourceMappingURL=clm.controller.js.map