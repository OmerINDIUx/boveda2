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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FoldersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const access_scope_service_1 = require("../../common/access-scope.service");
const audit_service_1 = require("../audit/audit.service");
const discipline_entity_1 = require("./discipline.entity");
const folder_entity_1 = require("./folder.entity");
let FoldersService = class FoldersService {
    folders;
    disciplines;
    scope;
    audit;
    constructor(folders, disciplines, scope, audit) {
        this.folders = folders;
        this.disciplines = disciplines;
        this.scope = scope;
        this.audit = audit;
    }
    async list(userId, projectId) {
        if (!(await this.scope.canAccessProject(userId, projectId))) {
            throw new common_1.ForbiddenException('No tienes acceso a este proyecto');
        }
        return this.folders.find({ where: { projectId } });
    }
    async create(userId, dto) {
        if (!(await this.scope.canAccessProject(userId, dto.projectId))) {
            throw new common_1.ForbiddenException('No tienes acceso a este proyecto');
        }
        const parent = dto.parentId
            ? await this.folders.findOne({ where: { id: dto.parentId, projectId: dto.projectId } })
            : null;
        const path = parent ? `${parent.path}/${dto.name}` : dto.name;
        const saved = await this.folders.save(this.folders.create({
            ...dto,
            path,
            createdById: userId,
        }));
        await this.audit.record({
            actorId: userId,
            action: 'folder.create',
            entityType: 'folder',
            entityId: saved.id,
            metadata: { projectId: dto.projectId, path },
        });
        return saved;
    }
    listDisciplines() {
        return this.disciplines.find({ order: { code: 'ASC', name: 'ASC' } });
    }
    async createDiscipline(userId, dto) {
        const saved = await this.disciplines.save(this.disciplines.create({
            code: dto.code.trim().toUpperCase(),
            name: dto.name.trim(),
            description: dto.description?.trim(),
        }));
        await this.audit.record({
            actorId: userId,
            action: 'discipline.create',
            entityType: 'discipline',
            entityId: saved.id,
            metadata: { code: saved.code, name: saved.name },
        });
        return saved;
    }
    async updateDiscipline(userId, id, dto) {
        const discipline = await this.disciplines.findOne({ where: { id } });
        if (!discipline) {
            throw new common_1.NotFoundException('Disciplina no encontrada');
        }
        if (dto.code !== undefined)
            discipline.code = dto.code.trim().toUpperCase();
        if (dto.name !== undefined)
            discipline.name = dto.name.trim();
        if (dto.description !== undefined)
            discipline.description = dto.description.trim();
        const saved = await this.disciplines.save(discipline);
        await this.audit.record({
            actorId: userId,
            action: 'discipline.update',
            entityType: 'discipline',
            entityId: id,
            metadata: { ...dto },
        });
        return saved;
    }
    async deactivateDiscipline(userId, id) {
        const discipline = await this.disciplines.findOne({ where: { id } });
        if (!discipline) {
            throw new common_1.NotFoundException('Disciplina no encontrada');
        }
        await this.disciplines.softDelete(id);
        await this.audit.record({
            actorId: userId,
            action: 'discipline.deactivate',
            entityType: 'discipline',
            entityId: id,
        });
        return { ok: true, id };
    }
};
exports.FoldersService = FoldersService;
exports.FoldersService = FoldersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(folder_entity_1.Folder)),
    __param(1, (0, typeorm_1.InjectRepository)(discipline_entity_1.Discipline)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        access_scope_service_1.AccessScopeService,
        audit_service_1.AuditService])
], FoldersService);
//# sourceMappingURL=folders.service.js.map