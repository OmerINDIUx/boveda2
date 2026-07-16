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
exports.ApprovalsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const active_user_guard_1 = require("../../common/guards/active-user.guard");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_1 = require("../../common/permissions");
const approval_action_dto_1 = require("./dto/approval-action.dto");
const create_approval_flow_dto_1 = require("./dto/create-approval-flow.dto");
const create_approval_request_dto_1 = require("./dto/create-approval-request.dto");
const update_approval_flow_dto_1 = require("./dto/update-approval-flow.dto");
const approvals_service_1 = require("./approvals.service");
let ApprovalsController = class ApprovalsController {
    approvals;
    constructor(approvals) {
        this.approvals = approvals;
    }
    listFlows(user, projectId) {
        return this.approvals.listFlows(user.id, projectId);
    }
    createFlow(user, dto) {
        return this.approvals.createFlow(user.id, dto);
    }
    flowDetail(user, id) {
        return this.approvals.getFlowDetail(user.id, id);
    }
    updateFlow(user, id, dto) {
        return this.approvals.updateFlow(user.id, id, dto);
    }
    deactivateFlow(user, id) {
        return this.approvals.deactivateFlow(user.id, id);
    }
    startRequest(user, dto) {
        return this.approvals.startDocumentApproval(user.id, dto);
    }
    pending(user) {
        return this.approvals.listPendingForUser(user.id, user.roles);
    }
    history(user, documentId) {
        return this.approvals.listHistory(user.id, documentId);
    }
    detail(user, id) {
        return this.approvals.getRequestDetail(user.id, id);
    }
    approve(user, id, dto) {
        return this.approvals.approve(user.id, user.roles, id, dto);
    }
    reject(user, id, dto) {
        return this.approvals.reject(user.id, user.roles, id, dto);
    }
    requestChanges(user, id, dto) {
        return this.approvals.requestChanges(user.id, user.roles, id, dto);
    }
    comment(user, id, dto) {
        return this.approvals.comment(user.id, id, dto);
    }
};
exports.ApprovalsController = ApprovalsController;
__decorate([
    (0, common_1.Get)('flows'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.ApprovalsManage),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "listFlows", null);
__decorate([
    (0, common_1.Post)('flows'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.ApprovalsManage),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_approval_flow_dto_1.CreateApprovalFlowDto]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "createFlow", null);
__decorate([
    (0, common_1.Get)('flows/:id'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.ApprovalsManage),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "flowDetail", null);
__decorate([
    (0, common_1.Patch)('flows/:id'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.ApprovalsManage),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_approval_flow_dto_1.UpdateApprovalFlowDto]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "updateFlow", null);
__decorate([
    (0, common_1.Patch)('flows/:id/deactivate'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.ApprovalsManage),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "deactivateFlow", null);
__decorate([
    (0, common_1.Post)('requests'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.DocumentsApprove),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_approval_request_dto_1.CreateApprovalRequestDto]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "startRequest", null);
__decorate([
    (0, common_1.Get)('requests/pending'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.DocumentsApprove),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "pending", null);
__decorate([
    (0, common_1.Get)('requests/history'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.DocumentsApprove),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('documentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "history", null);
__decorate([
    (0, common_1.Get)('requests/:id'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.DocumentsApprove),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "detail", null);
__decorate([
    (0, common_1.Post)('requests/:id/approve'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.DocumentsApprove),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, approval_action_dto_1.ApprovalActionDto]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)('requests/:id/reject'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.DocumentsApprove),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, approval_action_dto_1.ApprovalActionDto]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)('requests/:id/request-changes'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.DocumentsApprove),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, approval_action_dto_1.ApprovalActionDto]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "requestChanges", null);
__decorate([
    (0, common_1.Post)('requests/:id/comment'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.DocumentsApprove),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, approval_action_dto_1.ApprovalActionDto]),
    __metadata("design:returntype", void 0)
], ApprovalsController.prototype, "comment", null);
exports.ApprovalsController = ApprovalsController = __decorate([
    (0, swagger_1.ApiTags)('approvals'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, active_user_guard_1.ActiveUserGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('approvals'),
    __metadata("design:paramtypes", [approvals_service_1.ApprovalsService])
], ApprovalsController);
//# sourceMappingURL=approvals.controller.js.map