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
exports.AiQueryController = void 0;
const common_1 = require('@nestjs/common');
const swagger_1 = require('@nestjs/swagger');
const current_user_decorator_1 = require('../../common/decorators/current-user.decorator');
const permissions_decorator_1 = require('../../common/decorators/permissions.decorator');
const active_user_guard_1 = require('../../common/guards/active-user.guard');
const jwt_auth_guard_1 = require('../../common/guards/jwt-auth.guard');
const permissions_guard_1 = require('../../common/guards/permissions.guard');
const permissions_1 = require('../../common/permissions');
const ai_query_service_1 = require('./ai-query.service');
const ask_document_query_dto_1 = require('./dto/ask-document-query.dto');
let AiQueryController = class AiQueryController {
  aiQuery;
  constructor(aiQuery) {
    this.aiQuery = aiQuery;
  }
  ask(user, dto) {
    return this.aiQuery.ask(user.id, dto);
  }
  history(user) {
    return this.aiQuery.historyForUser(user.id);
  }
};
exports.AiQueryController = AiQueryController;
__decorate(
  [
    (0, common_1.Post)('ask'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.AiQuery),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', [Object, ask_document_query_dto_1.AskDocumentQueryDto]),
    __metadata('design:returntype', void 0),
  ],
  AiQueryController.prototype,
  'ask',
  null
);
__decorate(
  [
    (0, common_1.Get)('history'),
    (0, permissions_decorator_1.Permissions)(permissions_1.PermissionKey.AiQuery),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata('design:type', Function),
    __metadata('design:paramtypes', [Object]),
    __metadata('design:returntype', void 0),
  ],
  AiQueryController.prototype,
  'history',
  null
);
exports.AiQueryController = AiQueryController = __decorate(
  [
    (0, swagger_1.ApiTags)('ai-query'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(
      jwt_auth_guard_1.JwtAuthGuard,
      active_user_guard_1.ActiveUserGuard,
      permissions_guard_1.PermissionsGuard
    ),
    (0, common_1.Controller)('ai-query'),
    __metadata('design:paramtypes', [ai_query_service_1.AiQueryService]),
  ],
  AiQueryController
);
//# sourceMappingURL=ai-query.controller.js.map
