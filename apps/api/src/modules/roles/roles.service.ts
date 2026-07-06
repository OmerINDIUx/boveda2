import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { Permission } from './permission.entity';
import { Role } from './role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    @InjectRepository(Permission) private readonly permissions: Repository<Permission>,
    private readonly audit: AuditService
  ) {}

  listRoles() {
    return this.roles.find({ relations: ['permissions'] });
  }

  listPermissions() {
    return this.permissions.find({ order: { module: 'ASC', key: 'ASC' } });
  }

  async create(dto: CreateRoleDto) {
    const role = this.roles.create({
      key: dto.key,
      name: dto.name,
      description: dto.description,
      permissions: dto.permissionIds?.length ? await this.permissions.findBy({ id: In(dto.permissionIds) }) : []
    });
    const saved = await this.roles.save(role);
    await this.audit.record({
      action: 'role.create',
      entityType: 'role',
      entityId: saved.id,
      metadata: { key: saved.key, permissionIds: dto.permissionIds ?? [] }
    });
    return saved;
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.roles.findOne({ where: { id }, relations: ['permissions'] });
    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    const before = {
      id: role.id,
      key: role.key,
      name: role.name,
      permissionIds: role.permissions?.map((permission) => permission.id) ?? []
    };
    if (dto.key !== undefined) role.key = dto.key;
    if (dto.name !== undefined) role.name = dto.name;
    if (dto.description !== undefined) role.description = dto.description;
    if (dto.permissionIds) role.permissions = await this.permissions.findBy({ id: In(dto.permissionIds) });
    const saved = await this.roles.save(role);
    await this.audit.record({
      action: 'role.update',
      entityType: 'role',
      entityId: id,
      metadata: {
        before,
        after: {
          id: saved.id,
          key: saved.key,
          name: saved.name,
          permissionIds: saved.permissions?.map((permission) => permission.id) ?? []
        }
      }
    });
    return saved;
  }

  async assignPermissions(id: string, permissionIds: string[]) {
    return this.update(id, { permissionIds });
  }
}
