import { JwtService } from '@nestjs/jwt';
import { AuditService } from '../audit/audit.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
  private readonly users;
  private readonly jwt;
  private readonly audit;
  constructor(users: UsersService, jwt: JwtService, audit: AuditService);
  login(dto: LoginDto): Promise<{
    accessToken: string;
    user: {
      id: string;
      name: string;
      email: string;
      roles: string[];
      permissions: string[];
    };
  }>;
  logout(userId?: string): Promise<{
    ok: boolean;
  }>;
}
