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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const audit_service_1 = require("../audit/audit.service");
const users_service_1 = require("../users/users.service");
let AuthService = class AuthService {
    users;
    jwt;
    audit;
    constructor(users, jwt, audit) {
        this.users = users;
        this.jwt = jwt;
        this.audit = audit;
    }
    async login(dto) {
        const user = await this.users.findByEmailWithRoles(dto.email);
        if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
            throw new common_1.UnauthorizedException('Credenciales invalidas');
        }
        if (!user.active) {
            throw new common_1.UnauthorizedException('Usuario inactivo');
        }
        const roles = user.roles?.map((role) => role.key) ?? [];
        const permissions = user.roles?.flatMap((role) => role.permissions?.map((permission) => permission.key) ?? []) ?? [];
        const accessToken = await this.jwt.signAsync({
            id: user.id,
            name: user.name,
            email: user.email,
            active: user.active,
            roles,
            permissions
        });
        await this.audit.record({
            actorId: user.id,
            action: 'auth.login',
            entityType: 'user',
            entityId: user.id,
            metadata: { email: user.email }
        });
        return {
            accessToken,
            user: { id: user.id, name: user.name, email: user.email, roles, permissions }
        };
    }
    async logout(userId) {
        if (userId) {
            await this.audit.record({
                actorId: userId,
                action: 'auth.logout',
                entityType: 'user',
                entityId: userId
            });
        }
        return { ok: true };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        audit_service_1.AuditService])
], AuthService);
//# sourceMappingURL=auth.service.js.map