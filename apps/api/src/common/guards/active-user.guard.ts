import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { RequestUser } from '../interfaces/request-user.interface';

@Injectable()
export class ActiveUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    if (!request.user?.active) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    return true;
  }
}
