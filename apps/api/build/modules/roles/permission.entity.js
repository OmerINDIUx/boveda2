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
Object.defineProperty(exports, '__esModule', { value: true });
exports.Permission = void 0;
const typeorm_1 = require('typeorm');
let Permission = class Permission {
  id;
  key;
  label;
  module;
  createdAt;
  updatedAt;
};
exports.Permission = Permission;
__decorate(
  [(0, typeorm_1.PrimaryGeneratedColumn)('uuid'), __metadata('design:type', String)],
  Permission.prototype,
  'id',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ unique: true, length: 120 }), __metadata('design:type', String)],
  Permission.prototype,
  'key',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ length: 180 }), __metadata('design:type', String)],
  Permission.prototype,
  'label',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ length: 80 }), __metadata('design:type', String)],
  Permission.prototype,
  'module',
  void 0
);
__decorate(
  [(0, typeorm_1.CreateDateColumn)({ name: 'created_at' }), __metadata('design:type', Date)],
  Permission.prototype,
  'createdAt',
  void 0
);
__decorate(
  [(0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }), __metadata('design:type', Date)],
  Permission.prototype,
  'updatedAt',
  void 0
);
exports.Permission = Permission = __decorate([(0, typeorm_1.Entity)('permissions')], Permission);
//# sourceMappingURL=permission.entity.js.map
