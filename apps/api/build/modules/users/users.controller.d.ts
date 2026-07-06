import { RequestUser } from '../../common/interfaces/request-user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly users;
    constructor(users: UsersService);
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
    me(user: RequestUser): Promise<{
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
    updateProfile(user: RequestUser, dto: UpdateUserDto): Promise<{
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
    activate(id: string): Promise<{
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
    deactivate(id: string): Promise<{
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
}
