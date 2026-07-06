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
exports.Project = void 0;
const typeorm_1 = require('typeorm');
const user_entity_1 = require('../users/user.entity');
let Project = class Project {
  id;
  name;
  code;
  description;
  workType;
  currentStage;
  priority;
  responsibleUserId;
  responsibleUser;
  targetDate;
  status;
  isActive;
  disciplineIds;
  ownerId;
  createdAt;
  updatedAt;
  deletedAt;
};
exports.Project = Project;
__decorate(
  [(0, typeorm_1.PrimaryGeneratedColumn)('uuid'), __metadata('design:type', String)],
  Project.prototype,
  'id',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ length: 140 }), __metadata('design:type', String)],
  Project.prototype,
  'name',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ unique: true, length: 40 }), __metadata('design:type', String)],
  Project.prototype,
  'code',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ type: 'text', nullable: true }), __metadata('design:type', String)],
  Project.prototype,
  'description',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'work_type', length: 120, nullable: true }),
    __metadata('design:type', String),
  ],
  Project.prototype,
  'workType',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'current_stage', length: 120, nullable: true }),
    __metadata('design:type', String),
  ],
  Project.prototype,
  'currentStage',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ length: 30, default: 'media' }), __metadata('design:type', String)],
  Project.prototype,
  'priority',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'responsible_user_id', nullable: true }),
    __metadata('design:type', String),
  ],
  Project.prototype,
  'responsibleUserId',
  void 0
);
__decorate(
  [
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'responsible_user_id' }),
    __metadata('design:type', user_entity_1.User),
  ],
  Project.prototype,
  'responsibleUser',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'target_date', type: 'date', nullable: true }),
    __metadata('design:type', String),
  ],
  Project.prototype,
  'targetDate',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ default: 'planificacion', length: 40 }),
    __metadata('design:type', String),
  ],
  Project.prototype,
  'status',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'is_active', default: true }), __metadata('design:type', Boolean)],
  Project.prototype,
  'isActive',
  void 0
);
__decorate(
  [
    (0, typeorm_1.Column)({ name: 'discipline_ids', type: 'simple-json', nullable: true }),
    __metadata('design:type', Array),
  ],
  Project.prototype,
  'disciplineIds',
  void 0
);
__decorate(
  [(0, typeorm_1.Column)({ name: 'owner_id', nullable: true }), __metadata('design:type', String)],
  Project.prototype,
  'ownerId',
  void 0
);
__decorate(
  [(0, typeorm_1.CreateDateColumn)({ name: 'created_at' }), __metadata('design:type', Date)],
  Project.prototype,
  'createdAt',
  void 0
);
__decorate(
  [(0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }), __metadata('design:type', Date)],
  Project.prototype,
  'updatedAt',
  void 0
);
__decorate(
  [(0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }), __metadata('design:type', Date)],
  Project.prototype,
  'deletedAt',
  void 0
);
exports.Project = Project = __decorate([(0, typeorm_1.Entity)('projects')], Project);
//# sourceMappingURL=project.entity.js.map
