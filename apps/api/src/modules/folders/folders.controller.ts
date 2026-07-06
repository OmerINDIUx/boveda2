import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { PermissionKey } from '../../common/permissions';
import { CreateFolderDto } from './dto/create-folder.dto';
import { CreateDisciplineDto } from './dto/create-discipline.dto';
import { UpdateDisciplineDto } from './dto/update-discipline.dto';
import { FoldersService } from './folders.service';

@ApiTags('folders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Controller('folders')
export class FoldersController {
  constructor(private readonly folders: FoldersService) {}

  @Get()
  @Permissions(PermissionKey.ProjectsView)
  list(@CurrentUser() user: RequestUser, @Query('projectId') projectId: string) {
    return this.folders.list(user.id, projectId);
  }

  @Post()
  @Permissions(PermissionKey.ProjectsManage)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateFolderDto) {
    return this.folders.create(user.id, dto);
  }

  @Get('disciplines')
  @Permissions(PermissionKey.ProjectsView)
  disciplines() {
    return this.folders.listDisciplines();
  }

  @Post('disciplines')
  @Permissions(PermissionKey.ProjectsManage)
  createDiscipline(@CurrentUser() user: RequestUser, @Body() dto: CreateDisciplineDto) {
    return this.folders.createDiscipline(user.id, dto);
  }

  @Patch('disciplines/:id')
  @Permissions(PermissionKey.ProjectsManage)
  updateDiscipline(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateDisciplineDto
  ) {
    return this.folders.updateDiscipline(user.id, id, dto);
  }

  @Patch('disciplines/:id/deactivate')
  @Permissions(PermissionKey.ProjectsManage)
  deactivateDiscipline(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.folders.deactivateDiscipline(user.id, id);
  }
}
