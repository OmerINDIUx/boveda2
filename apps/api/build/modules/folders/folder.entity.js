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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Folder = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const discipline_entity_1 = require("./discipline.entity");
let Folder = class Folder {
    id;
    projectId;
    parentId;
    parent;
    disciplineId;
    discipline;
    name;
    path;
    createdById;
    createdBy;
    createdAt;
    updatedAt;
    deletedAt;
};
exports.Folder = Folder;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Folder.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_id' }),
    __metadata("design:type", String)
], Folder.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'parent_id', nullable: true }),
    __metadata("design:type", String)
], Folder.prototype, "parentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Folder),
    (0, typeorm_1.JoinColumn)({ name: 'parent_id' }),
    __metadata("design:type", Folder)
], Folder.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'discipline_id', nullable: true }),
    __metadata("design:type", String)
], Folder.prototype, "disciplineId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => discipline_entity_1.Discipline),
    (0, typeorm_1.JoinColumn)({ name: 'discipline_id' }),
    __metadata("design:type", discipline_entity_1.Discipline)
], Folder.prototype, "discipline", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 140 }),
    __metadata("design:type", String)
], Folder.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 600, nullable: true }),
    __metadata("design:type", String)
], Folder.prototype, "path", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by_id', nullable: true }),
    __metadata("design:type", String)
], Folder.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by_id' }),
    __metadata("design:type", user_entity_1.User)
], Folder.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Folder.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Folder.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Date)
], Folder.prototype, "deletedAt", void 0);
exports.Folder = Folder = __decorate([
    (0, typeorm_1.Entity)('folders')
], Folder);
//# sourceMappingURL=folder.entity.js.map