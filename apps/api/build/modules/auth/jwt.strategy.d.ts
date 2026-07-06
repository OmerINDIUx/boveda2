import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { UsersService } from '../users/users.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly users;
    constructor(config: ConfigService, users: UsersService);
    validate(payload: RequestUser): Promise<RequestUser>;
}
export {};
