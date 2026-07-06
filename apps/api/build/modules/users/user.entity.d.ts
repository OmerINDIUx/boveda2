import { Role } from '../roles/role.entity';
export declare class User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  active: boolean;
  lastLoginAt?: Date;
  roles: Role[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
