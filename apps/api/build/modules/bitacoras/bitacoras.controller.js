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
exports.BitacorasController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const active_user_guard_1 = require("../../common/guards/active-user.guard");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const permissions_1 = require("../../common/permissions");
const bitacoras_service_1 = require("./bitacoras.service");
const create_bitacora_entry_dto_1 = require("./dto/create-bitacora-entry.dto");
const update_bitacora_entry_dto_1 = require("./dto/update-bitacora-entry.dto");
const bitacora_list_query_dto_1 = require("./dto/bitacora-list-query.dto");
const sign_bitacora_entry_dto_1 = require("./dto/sign-bitacora-entry.dto");
let BitacorasController = class BitacorasController {
    bitacoras;
    constructor(bitacoras) {
        this.bitacoras = bitacoras;
    }
    list(user, query) {
        return this.bitacoras.listEntries(user, query);
    }
    formOptions(user, projectId) {
        return this.bitacoras.getFormOptions(user, projectId);
    }
    report(user, projectId, tipo, fecha) {
        return this.bitacoras.getReport(user, projectId, tipo, fecha);
    }
    detail(user, id) {
        return this.bitacoras.getDetail(user, id);
    }
    create(user, dto) {
        return this.bitacoras.create(user, dto);
    }
    update(user, id, dto) {
        return this.bitacoras.update(user, id, dto);
    }
    sign(user, id, dto) {
        return this.bitacoras.sign(user, id, dto);
    }
    delete(user, id) {
        return this.bitacoras.delete(user, id);
    }
    uploadPhoto(user, id, body) {
        return this.bitacoras.uploadPhoto(user, id, body);
    }
    deletePhoto(user, id, photoId) {
        return this.bitacoras.deletePhoto(user, id, photoId);
    }
    exportPdf(user, id) {
        return this.bitacoras.exportPdf(user, id);
    }
};
exports.BitacorasController = BitacorasController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, bitacora_list_query_dto_1.BitacoraListQueryDto]),
    __metadata("design:returntype", void 0)
], BitacorasController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('form-options'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BitacorasController.prototype, "formOptions", null);
__decorate([
    (0, common_1.Get)('report'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('projectId')),
    __param(2, (0, common_1.Query)('tipo')),
    __param(3, (0, common_1.Query)('fecha')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], BitacorasController.prototype, "report", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BitacorasController.prototype, "detail", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_bitacora_entry_dto_1.CreateBitacoraEntryDto]),
    __metadata("design:returntype", void 0)
], BitacorasController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_bitacora_entry_dto_1.UpdateBitacoraEntryDto]),
    __metadata("design:returntype", void 0)
], BitacorasController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/sign'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, sign_bitacora_entry_dto_1.SignBitacoraEntryDto]),
    __metadata("design:returntype", void 0)
], BitacorasController.prototype, "sign", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BitacorasController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/photos'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_bitacora_entry_dto_1.PhotoInputDto]),
    __metadata("design:returntype", void 0)
], BitacorasController.prototype, "uploadPhoto", null);
__decorate([
    (0, common_1.Delete)(':id/photos/:photoId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('photoId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], BitacorasController.prototype, "deletePhoto", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BitacorasController.prototype, "exportPdf", null);
exports.BitacorasController = BitacorasController = __decorate([
    (0, swagger_1.ApiTags)('bitacoras'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, active_user_guard_1.ActiveUserGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.BitacorasView),
    (0, common_1.Controller)('bitacoras'),
    __metadata("design:paramtypes", [bitacoras_service_1.BitacorasService])
], BitacorasController);
//# sourceMappingURL=bitacoras.controller.js.map