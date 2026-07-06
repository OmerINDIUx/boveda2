import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { Role } from '../roles/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';
export declare class UsersService {
    private readonly users;
    private readonly roles;
    private readonly audit;
    constructor(users: Repository<User>, roles: Repository<Role>, audit: AuditService);
    findAll(): Promise<{
        id: string;
        name: string;
        email: string;
        active: boolean;
        roles: {
            id: string;
            key: string;
            name: string;
        }[];
    }[]>;
    findProfile(userId: string): Promise<{
        id: string;
        name: string;
        email: string;
        active: boolean;
        roles: {
            id: string;
            key: string;
            name: string;
        }[];
    }>;
    findByEmailWithRoles(email: string): Promise<User | null>;
    findByIdWithRoles(id: string): Promise<User | null>;
    create(dto: CreateUserDto): Promise<{
        id: string;
        name: string;
        email: string;
        active: boolean;
        roles: {
            id: string;
            key: string;
            name: string;
        }[];
    }>;
    update(id: string, dto: UpdateUserDto): Promise<{
        id: string;
        name: string;
        email: string;
        active: boolean;
        roles: {
            id: string;
            key: string;
            name: string;
        }[];
    }>;
    updateProfile(id: string, dto: UpdateUserDto): Promise<{
        id: string;
        name: string;
        email: string;
        active: boolean;
        roles: {
            id: string;
            key: string;
            name: string;
        }[];
    }>;
    setActive(id: string, active: boolean): Promise<{
        id: string;
        name: string;
        email: string;
        active: boolean;
        roles: {
            id: string;
            key: string;
            name: string;
        }[];
    }>;
    private serializeUser;
}
