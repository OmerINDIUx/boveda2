import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PermissionKey } from '../../common/permissions';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Permissions(PermissionKey.UsersRead)
  findAll() {
    return this.users.findAll();
  }

  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return this.users.findProfile(user.id);
  }

  @Post()
  @Permissions(PermissionKey.UsersManage)
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: RequestUser, @Body() dto: UpdateUserDto) {
    return this.users.updateProfile(user.id, dto);
  }

  @Patch(':id')
  @Permissions(PermissionKey.UsersManage)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  @Patch(':id/activate')
  @Permissions(PermissionKey.UsersManage)
  activate(@Param('id') id: string) {
    return this.users.setActive(id, true);
  }

  @Patch(':id/deactivate')
  @Permissions(PermissionKey.UsersManage)
  deactivate(@Param('id') id: string) {
    return this.users.setActive(id, false);
  }
}
