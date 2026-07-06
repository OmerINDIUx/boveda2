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
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const audit_service_1 = require("../audit/audit.service");
const permission_entity_1 = require("./permission.entity");
const role_entity_1 = require("./role.entity");
let RolesService = class RolesService {
    roles;
    permissions;
    audit;
    constructor(roles, permissions, audit) {
        this.roles = roles;
        this.permissions = permissions;
        this.audit = audit;
    }
    listRoles() {
        return this.roles.find({ relations: ['permissions'] });
    }
    listPermissions() {
        return this.permissions.find({ order: { module: 'ASC', key: 'ASC' } });
    }
    async create(dto) {
        const role = this.roles.create({
            key: dto.key,
            name: dto.name,
            description: dto.description,
            permissions: dto.permissionIds?.length ? await this.permissions.findBy({ id: (0, typeorm_2.In)(dto.permissionIds) }) : []
        });
        const saved = await this.roles.save(role);
        await this.audit.record({
            action: 'role.create',
            entityType: 'role',
            entityId: saved.id,
            metadata: { key: saved.key, permissionIds: dto.permissionIds ?? [] }
        });
        return saved;
    }
    async update(id, dto) {
        const role = await this.roles.findOne({ where: { id }, relations: ['permissions'] });
        if (!role) {
            throw new common_1.NotFoundException('Rol no encontrado');
        }
        const before = {
            id: role.id,
            key: role.key,
            name: role.name,
            permissionIds: role.permissions?.map((permission) => permission.id) ?? []
        };
        if (dto.key !== undefined)
            role.key = dto.key;
        if (dto.name !== undefined)
            role.name = dto.name;
        if (dto.description !== undefined)
            role.description = dto.description;
        if (dto.permissionIds)
            role.permissions = await this.permissions.findBy({ id: (0, typeorm_2.In)(dto.permissionIds) });
        const saved = await this.roles.save(role);
        await this.audit.record({
            action: 'role.update',
            entityType: 'role',
            entityId: id,
            metadata: {
                before,
                after: {
                    id: saved.id,
                    key: saved.key,
                    name: saved.name,
                    permissionIds: saved.permissions?.map((permission) => permission.id) ?? []
                }
            }
        });
        return saved;
    }
    async assignPermissions(id, permissionIds) {
        return this.update(id, { permissionIds });
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(1, (0, typeorm_1.InjectRepository)(permission_entity_1.Permission)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        audit_service_1.AuditService])
], RolesService);
//# sourceMappingURL=roles.service.js.map