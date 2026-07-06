import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';
export declare class RolesController {
  private readonly roles;
  constructor(roles: RolesService);
  listRoles(): Promise<import('./role.entity').Role[]>;
  create(dto: CreateRoleDto): Promise<import('./role.entity').Role>;
  update(id: string, dto: UpdateRoleDto): Promise<import('./role.entity').Role>;
  assignPermissions(id: string, permissionIds: string[]): Promise<import('./role.entity').Role>;
  listPermissions(): Promise<import('./permission.entity').Permission[]>;
}
