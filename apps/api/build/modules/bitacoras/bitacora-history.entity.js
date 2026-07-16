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
exports.BitacoraHistory = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const bitacora_entry_entity_1 = require("./bitacora-entry.entity");
let BitacoraHistory = class BitacoraHistory {
    id;
    entryId;
    entry;
    actorId;
    actor;
    accion;
    beforeState;
    afterState;
    createdAt;
};
exports.BitacoraHistory = BitacoraHistory;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BitacoraHistory.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'entry_id' }),
    __metadata("design:type", String)
], BitacoraHistory.prototype, "entryId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => bitacora_entry_entity_1.BitacoraEntry),
    (0, typeorm_1.JoinColumn)({ name: 'entry_id' }),
    __metadata("design:type", bitacora_entry_entity_1.BitacoraEntry)
], BitacoraHistory.prototype, "entry", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'actor_id', nullable: true }),
    __metadata("design:type", String)
], BitacoraHistory.prototype, "actorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'actor_id' }),
    __metadata("design:type", user_entity_1.User)
], BitacoraHistory.prototype, "actor", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 80 }),
    __metadata("design:type", String)
], BitacoraHistory.prototype, "accion", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'before_state', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], BitacoraHistory.prototype, "beforeState", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'after_state', type: 'json', nullable: true }),
    __metadata("design:type", Object)
], BitacoraHistory.prototype, "afterState", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], BitacoraHistory.prototype, "createdAt", void 0);
exports.BitacoraHistory = BitacoraHistory = __decorate([
    (0, typeorm_1.Entity)('bitacora_history')
], BitacoraHistory);
//# sourceMappingURL=bitacora-history.entity.js.map