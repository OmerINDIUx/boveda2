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
exports.RolesController = void 0;
const common_1 = require('@nestjs/common');
const swagger_1 = require('@nestjs/swagger');
const permissions_decorator_1 = require('../../common/decorators/permissions.decorator');
const active_user_guard_1 = require('../../common/guards/active-user.guard');
const jwt_auth_guard_1 = require('../../common/guards/jwt-auth.guard');
const permissions_guard_1 = require('../../common/guards/permissions.guard');
const permissions_1 = require('../../common/permissions');
const create_role_dto_1 = require('./dto/create-role.dto');
const update_role_dto_1 = require('./dto/update-role.dto');
const roles_service_1 = require('./roles.service');
let RolesController = class RolesController {
  roles;
  constructor(roles) {
    this.roles = roles;
  }
  listRoles() {
    return this.roles.listRoles();
  }
  create(dto) {
    return this.roles.create(dto);
  }
  update(id, dto) {
    return this.roles.update(id, dto);
  }
  assignPermissions(id, permissionIds) {
    return this.roles.assignPermissions(id, permissionIds);
  }
  listPermissions() {
    return this.roles.listPermissions();
  }
};
exports.RolesController = RolesController;
__decorate(
  [
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.RolesRead),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', []),
    __metadata('design:returntype', void 0),
  ],
  RolesController.prototype,
  'listRoles',
  null
);
__decorate(
  [
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.RolesManage),
    __param(0, (0, common_1.Body)()),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', [create_role_dto_1.CreateRoleDto]),
    __metadata('design:returntype', void 0),
  ],
  RolesController.prototype,
  'create',
  null
);
__decorate(
  [
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.RolesManage),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', [String, update_role_dto_1.UpdateRoleDto]),
    __metadata('design:returntype', void 0),
  ],
  RolesController.prototype,
  'update',
  null
);
__decorate(
  [
    (0, common_1.Patch)(':id/permissions'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.RolesManage),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('permissionIds')),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', [String, Array]),
    __metadata('design:returntype', void 0),
  ],
  RolesController.prototype,
  'assignPermissions',
  null
);
__decorate(
  [
    (0, common_1.Get)('permissions'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.RolesRead),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', []),
    __metadata('design:returntype', void 0),
  ],
  RolesController.prototype,
  'listPermissions',
  null
);
exports.RolesController = RolesController = __decorate(
  [
    (0, swagger_1.ApiTags)('roles'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(
      jwt_auth_guard_1.JwtAuthGuard,
      active_user_guard_1.ActiveUserGuard,
      permissions_guard_1.PermissionsGuard
    ),
    (0, common_1.Controller)('roles'),
    __metadata('design:paramtypes', [roles_service_1.RolesService]),
  ],
  RolesController
);
//# sourceMappingURL=roles.controller.js.map
