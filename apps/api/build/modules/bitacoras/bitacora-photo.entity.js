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
exports.BitacoraPhoto = void 0;
const typeorm_1 = require("typeorm");
const bitacora_entry_entity_1 = require("./bitacora-entry.entity");
let BitacoraPhoto = class BitacoraPhoto {
    id;
    entryId;
    entry;
    filePath;
    descripcion;
    tipo;
    createdAt;
};
exports.BitacoraPhoto = BitacoraPhoto;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], BitacoraPhoto.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'entry_id' }),
    __metadata("design:type", String)
], BitacoraPhoto.prototype, "entryId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => bitacora_entry_entity_1.BitacoraEntry),
    (0, typeorm_1.JoinColumn)({ name: 'entry_id' }),
    __metadata("design:type", bitacora_entry_entity_1.BitacoraEntry)
], BitacoraPhoto.prototype, "entry", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'file_path', length: 500 }),
    __metadata("design:type", String)
], BitacoraPhoto.prototype, "filePath", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], BitacoraPhoto.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 30, default: 'general' }),
    __metadata("design:type", String)
], BitacoraPhoto.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], BitacoraPhoto.prototype, "createdAt", void 0);
exports.BitacoraPhoto = BitacoraPhoto = __decorate([
    (0, typeorm_1.Entity)('bitacora_photos')
], BitacoraPhoto);
//# sourceMappingURL=bitacora-photo.entity.js.map