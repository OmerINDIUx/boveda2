import { User } from '../users/user.entity';
import { Permission } from './permission.entity';
export declare class Role {
  id: string;
  key: string;
  name: string;
  description?: string;
  permissions: Permission[];
  users: User[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
