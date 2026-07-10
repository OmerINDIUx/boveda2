import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService
  ) {}

  async login(dto: LoginDto) {
    const user = await this.users.findByEmailWithRoles(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      this.logger.warn(`Login failed for ${dto.email || 'unknown-email'}: invalid credentials`);
      throw new UnauthorizedException('Credenciales invalidas');
    }
    if (!user.active) {
      this.logger.warn(`Login blocked for ${dto.email}: inactive user`);
      throw new UnauthorizedException('Usuario inactivo');
    }

    const roles = user.roles?.map((role) => role.key) ?? [];
    const permissions =
      user.roles?.flatMap((role) => role.permissions?.map((permission) => permission.key) ?? []) ??
      [];
    const accessToken = await this.jwt.signAsync({
      id: user.id,
      name: user.name,
      email: user.email,
      active: user.active,
      language: user.language,
      roles,
      permissions,
    });

    await this.audit.record({
      actorId: user.id,
      action: 'auth.login',
      entityType: 'user',
      entityId: user.id,
      metadata: { email: user.email },
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        language: user.language,
        roles,
        permissions,
      },
    };
  }

  async logout(userId?: string) {
    if (userId) {
      await this.audit.record({
        actorId: userId,
        action: 'auth.logout',
        entityType: 'user',
        entityId: userId,
      });
    }
    return { ok: true };
  }
}
