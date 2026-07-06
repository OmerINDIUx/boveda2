'use strict';
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d;
    if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return (c > 3 && r && Object.defineProperty(target, key, r), r);
  };
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
      return Reflect.metadata(k, v);
  };
var __param =
  (this && this.__param) ||
  function (paramIndex, decorator) {
    return function (target, key) {
      decorator(target, key, paramIndex);
    };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.FoldersController = void 0;
const common_1 = require('@nestjs/common');
const swagger_1 = require('@nestjs/swagger');
const current_user_decorator_1 = require('../../common/decorators/current-user.decorator');
const permissions_decorator_1 = require('../../common/decorators/permissions.decorator');
const active_user_guard_1 = require('../../common/guards/active-user.guard');
const jwt_auth_guard_1 = require('../../common/guards/jwt-auth.guard');
const permissions_guard_1 = require('../../common/guards/permissions.guard');
const permissions_1 = require('../../common/permissions');
const create_folder_dto_1 = require('./dto/create-folder.dto');
const folders_service_1 = require('./folders.service');
let FoldersController = class FoldersController {
  folders;
  constructor(folders) {
    this.folders = folders;
  }
  list(user, projectId) {
    return this.folders.list(user.id, projectId);
  }
  create(user, dto) {
    return this.folders.create(user.id, dto);
  }
  disciplines() {
    return this.folders.listDisciplines();
  }
};
exports.FoldersController = FoldersController;
__decorate(
  [
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.ProjectsView),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('projectId')),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', [Object, String]),
    __metadata('design:returntype', void 0),
  ],
  FoldersController.prototype,
  'list',
  null
);
__decorate(
  [
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.ProjectsManage),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', [Object, create_folder_dto_1.CreateFolderDto]),
    __metadata('design:returntype', void 0),
  ],
  FoldersController.prototype,
  'create',
  null
);
__decorate(
  [
    (0, common_1.Get)('disciplines'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.ProjectsView),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', []),
    __metadata('design:returntype', void 0),
  ],
  FoldersController.prototype,
  'disciplines',
  null
);
exports.FoldersController = FoldersController = __decorate(
  [
    (0, swagger_1.ApiTags)('folders'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(
      jwt_auth_guard_1.JwtAuthGuard,
      active_user_guard_1.ActiveUserGuard,
      permissions_guard_1.PermissionsGuard
    ),
    (0, common_1.Controller)('folders'),
    __metadata('design:paramtypes', [folders_service_1.FoldersService]),
  ],
  FoldersController
);
//# sourceMappingURL=folders.controller.js.map
