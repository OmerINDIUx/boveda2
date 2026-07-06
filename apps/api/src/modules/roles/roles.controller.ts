import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PermissionKey } from '../../common/permissions';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get()
  @Permissions(PermissionKey.RolesRead)
  listRoles() {
    return this.roles.listRoles();
  }

  @Post()
  @Permissions(PermissionKey.RolesManage)
  create(@Body() dto: CreateRoleDto) {
    return this.roles.create(dto);
  }

  @Patch(':id')
  @Permissions(PermissionKey.RolesManage)
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.roles.update(id, dto);
  }

  @Patch(':id/permissions')
  @Permissions(PermissionKey.RolesManage)
  assignPermissions(@Param('id') id: string, @Body('permissionIds') permissionIds: string[]) {
    return this.roles.assignPermissions(id, permissionIds);
  }

  @Get('permissions')
  @Permissions(PermissionKey.RolesRead)
  listPermissions() {
    return this.roles.listPermissions();
  }
}
