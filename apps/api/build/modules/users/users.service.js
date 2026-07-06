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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const bcrypt = require("bcrypt");
const typeorm_2 = require("typeorm");
const audit_service_1 = require("../audit/audit.service");
const role_entity_1 = require("../roles/role.entity");
const user_entity_1 = require("./user.entity");
let UsersService = class UsersService {
    users;
    roles;
    audit;
    constructor(users, roles, audit) {
        this.users = users;
        this.roles = roles;
        this.audit = audit;
    }
    async findAll() {
        const users = await this.users.find({ relations: ['roles'] });
        return users.map((user) => this.serializeUser(user));
    }
    async findProfile(userId) {
        const user = await this.users.findOne({ where: { id: userId }, relations: ['roles', 'roles.permissions'] });
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        return this.serializeUser(user);
    }
    findByEmailWithRoles(email) {
        return this.users.findOne({ where: { email }, relations: ['roles', 'roles.permissions'] });
    }
    findByIdWithRoles(id) {
        return this.users.findOne({ where: { id }, relations: ['roles', 'roles.permissions'] });
    }
    async create(dto) {
        const user = this.users.create({
            name: dto.name,
            email: dto.email,
            passwordHash: await bcrypt.hash(dto.password, 12),
            roles: dto.roleIds?.length ? await this.roles.findBy({ id: (0, typeorm_2.In)(dto.roleIds) }) : []
        });
        const saved = await this.users.save(user);
        await this.audit.record({
            actorId: saved.id,
            action: 'user.create',
            entityType: 'user',
            entityId: saved.id,
            metadata: { email: saved.email, roleIds: dto.roleIds ?? [] }
        });
        return this.serializeUser(saved);
    }
    async update(id, dto) {
        const user = await this.users.findOne({ where: { id }, relations: ['roles'] });
        if (!user) {
            throw new common_1.NotFoundException('Usuario no encontrado');
        }
        const before = this.serializeUser(user);
        if (dto.name !== undefined)
            user.name = dto.name;
        if (dto.email !== undefined)
            user.email = dto.email;
        if (dto.active !== undefined)
            user.active = dto.active;
        if (dto.password)
            user.passwordHash = await bcrypt.hash(dto.password, 12);
        if (dto.roleIds)
            user.roles = await this.roles.findBy({ id: (0, typeorm_2.In)(dto.roleIds) });
        const saved = await this.users.save(user);
        await this.audit.record({
            actorId: id,
            action: 'user.update',
            entityType: 'user',
            entityId: id,
            metadata: { before, after: this.serializeUser(saved) }
        });
        return this.serializeUser(saved);
    }
    updateProfile(id, dto) {
        return this.update(id, { name: dto.name, email: dto.email, password: dto.password });
    }
    setActive(id, active) {
        return this.update(id, { active });
    }
    serializeUser(user) {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            active: user.active,
            roles: user.roles?.map((role) => ({ id: role.id, key: role.key, name: role.name })) ?? []
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        audit_service_1.AuditService])
], UsersService);
//# sourceMappingURL=users.service.js.map