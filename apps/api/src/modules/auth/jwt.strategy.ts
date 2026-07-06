import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly users: UsersService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'change-me'
    });
  }

  async validate(payload: RequestUser): Promise<RequestUser> {
    const user = await this.users.findByIdWithRoles(payload.id);
    if (!user?.active) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    const roles = user.roles?.map((role) => role.key) ?? [];
    const permissions = user.roles?.flatMap((role) => role.permissions?.map((permission) => permission.key) ?? []) ?? [];
    return { id: user.id, name: user.name, email: user.email, active: user.active, roles, permissions };
  }
}
