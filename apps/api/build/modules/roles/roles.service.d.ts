import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { Permission } from './permission.entity';
import { Role } from './role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
export declare class RolesService {
  private readonly roles;
  private readonly permissions;
  private readonly audit;
  constructor(roles: Repository<Role>, permissions: Repository<Permission>, audit: AuditService);
  listRoles(): Promise<Role[]>;
  listPermissions(): Promise<Permission[]>;
  create(dto: CreateRoleDto): Promise<Role>;
  update(id: string, dto: UpdateRoleDto): Promise<Role>;
  assignPermissions(id: string, permissionIds: string[]): Promise<Role>;
}
