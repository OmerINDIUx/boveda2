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
exports.Bitacora = void 0;
const typeorm_1 = require("typeorm");
const project_entity_1 = require("../projects/project.entity");
const bitacora_entry_entity_1 = require("./bitacora-entry.entity");
let Bitacora = class Bitacora {
    id;
    projectId;
    project;
    folioActual;
    entries;
    createdAt;
    updatedAt;
    deletedAt;
};
exports.Bitacora = Bitacora;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Bitacora.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_id' }),
    __metadata("design:type", String)
], Bitacora.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project),
    (0, typeorm_1.JoinColumn)({ name: 'project_id' }),
    __metadata("design:type", project_entity_1.Project)
], Bitacora.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'folio_actual', default: 0 }),
    __metadata("design:type", Number)
], Bitacora.prototype, "folioActual", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => bitacora_entry_entity_1.BitacoraEntry, (entry) => entry.bitacora),
    __metadata("design:type", Array)
], Bitacora.prototype, "entries", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Bitacora.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Bitacora.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Date)
], Bitacora.prototype, "deletedAt", void 0);
exports.Bitacora = Bitacora = __decorate([
    (0, typeorm_1.Entity)('bitacoras')
], Bitacora);
//# sourceMappingURL=bitacora.entity.js.map