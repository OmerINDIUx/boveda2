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
exports.DocumentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const active_user_guard_1 = require("../../common/guards/active-user.guard");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_1 = require("../../common/permissions");
const create_document_comment_dto_1 = require("./dto/create-document-comment.dto");
const create_document_dto_1 = require("./dto/create-document.dto");
const create_document_version_dto_1 = require("./dto/create-document-version.dto");
const document_list_query_dto_1 = require("./dto/document-list-query.dto");
const update_document_dto_1 = require("./dto/update-document.dto");
const documents_service_1 = require("./documents.service");
let DocumentsController = class DocumentsController {
    documents;
    constructor(documents) {
        this.documents = documents;
    }
    list(user, query) {
        return this.documents.listVisible(user.id, query);
    }
    create(user, dto) {
        return this.documents.create(user.id, dto);
    }
    detail(id, user) {
        return this.documents.getDetail(user.id, id);
    }
    async content(id, user, res) {
        const file = await this.documents.getCurrentContent(user.id, id);
        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);
        res.send(file.buffer);
    }
    update(id, user, dto) {
        return this.documents.update(user.id, id, dto);
    }
    comment(id, user, dto) {
        return this.documents.addComment(user.id, id, dto);
    }
    version(id, user, dto) {
        return this.documents.createVersion(user.id, id, dto);
    }
    requestApproval(id, user) {
        return this.documents.requestApproval(user.id, id);
    }
    async download(id, user, res) {
        const file = await this.documents.download(user.id, id);
        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
        res.send(file.buffer);
    }
    print(id, user) {
        return this.documents.print(user.id, id);
    }
    approve(id, user) {
        return this.documents.approve(user.id, id);
    }
    reject(id, user) {
        return this.documents.reject(user.id, id);
    }
    remove(id, user) {
        return this.documents.update(user.id, id, { status: 'archived' });
    }
};
exports.DocumentsController = DocumentsController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.DocumentsView),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, document_list_query_dto_1.DocumentListQueryDto]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.DocumentsCreate),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_document_dto_1.CreateDocumentDto]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.DocumentsView),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "detail", null);
__decorate([
    (0, common_1.Get)(':id/content'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.DocumentsView),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "content", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.DocumentsEdit),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_document_dto_1.UpdateDocumentDto]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/comments'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.DocumentsView),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, create_document_comment_dto_1.CreateDocumentCommentDto]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "comment", null);
__decorate([
    (0, common_1.Post)(':id/versions'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.DocumentsCreate),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, create_document_version_dto_1.CreateDocumentVersionDto]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "version", null);
__decorate([
    (0, common_1.Post)(':id/request-approval'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.DocumentsApprove),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "requestApproval", null);
__decorate([
    (0, common_1.Get)(':id/download'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.DocumentsDownload),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "download", null);
__decorate([
    (0, common_1.Post)(':id/print'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.DocumentsPrint),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "print", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.DocumentsApprove),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.DocumentsApprove),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "reject", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.DocumentsDelete),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "remove", null);
exports.DocumentsController = DocumentsController = __decorate([
    (0, swagger_1.ApiTags)('documents'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, active_user_guard_1.ActiveUserGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('documents'),
    __metadata("design:paramtypes", [documents_service_1.DocumentsService])
], DocumentsController);
//# sourceMappingURL=documents.controller.js.map