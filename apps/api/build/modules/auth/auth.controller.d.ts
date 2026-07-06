import { RequestUser } from '../../common/interfaces/request-user.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
  private readonly auth;
  constructor(auth: AuthService);
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
  logout(user: RequestUser): Promise<{
    ok: boolean;
  }>;
}
