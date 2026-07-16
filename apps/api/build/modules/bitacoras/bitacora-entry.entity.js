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
exports.BitacoraEntry = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const project_entity_1 = require("../projects/project.entity");
const bitacora_entity_1 = require("./bitacora.entity");
let BitacoraEntry = class BitacoraEntry {
    id;
    bitacoraId;
    bitacora;
    projectId;
    project;
    folio;
    fecha;
    turno;
    clima;
    descripcionGeneral;
    actividades;
    personal;
    equipos;
    materialesRecibidos;
    incidentes;
    seguridad;
    calidad;
    observaciones;
    avanceEstimado;
    estado;
    firmadoPorId;
    firmadoPor;
    firmadoEn;
    createdById;
    createdBy;
    createdAt;
    updatedAt;
    deletedAt;
};
exports.BitacoraEntry = BitacoraEntry;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BitacoraEntry.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'bitacora_id' }),
    __metadata("design:type", String)
], BitacoraEntry.prototype, "bitacoraId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => bitacora_entity_1.Bitacora, (bitacora) => bitacora.entries),
    (0, typeorm_1.JoinColumn)({ name: 'bitacora_id' }),
    __metadata("design:type", bitacora_entity_1.Bitacora)
], BitacoraEntry.prototype, "bitacora", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'project_id' }),
    __metadata("design:type", String)
], BitacoraEntry.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project),
    (0, typeorm_1.JoinColumn)({ name: 'project_id' }),
    __metadata("design:type", project_entity_1.Project)
], BitacoraEntry.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], BitacoraEntry.prototype, "folio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], BitacoraEntry.prototype, "fecha", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'matutino' }),
    __metadata("design:type", String)
], BitacoraEntry.prototype, "turno", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], BitacoraEntry.prototype, "clima", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'descripcion_general', type: 'text', nullable: true }),
    __metadata("design:type", String)
], BitacoraEntry.prototype, "descripcionGeneral", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], BitacoraEntry.prototype, "actividades", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], BitacoraEntry.prototype, "personal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], BitacoraEntry.prototype, "equipos", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'materiales_recibidos', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], BitacoraEntry.prototype, "materialesRecibidos", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], BitacoraEntry.prototype, "incidentes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], BitacoraEntry.prototype, "seguridad", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], BitacoraEntry.prototype, "calidad", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], BitacoraEntry.prototype, "observaciones", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'avance_estimado', type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], BitacoraEntry.prototype, "avanceEstimado", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'borrador' }),
    __metadata("design:type", String)
], BitacoraEntry.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'firmado_por_id', nullable: true }),
    __metadata("design:type", String)
], BitacoraEntry.prototype, "firmadoPorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'firmado_por_id' }),
    __metadata("design:type", user_entity_1.User)
], BitacoraEntry.prototype, "firmadoPor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'firmado_en', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], BitacoraEntry.prototype, "firmadoEn", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by_id' }),
    __metadata("design:type", String)
], BitacoraEntry.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_by_id' }),
    __metadata("design:type", user_entity_1.User)
], BitacoraEntry.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], BitacoraEntry.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], BitacoraEntry.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Date)
], BitacoraEntry.prototype, "deletedAt", void 0);
exports.BitacoraEntry = BitacoraEntry = __decorate([
    (0, typeorm_1.Entity)('bitacora_entries')
], BitacoraEntry);
//# sourceMappingURL=bitacora-entry.entity.js.map