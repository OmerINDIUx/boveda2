import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { PermissionKey } from '../../common/permissions';
import { CreateVersionDto } from './dto/create-version.dto';
import { VersionsService } from './versions.service';

@ApiTags('versions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Controller('versions')
export class VersionsController {
  constructor(private readonly versions: VersionsService) {}

  @Get()
  @Permissions(PermissionKey.DocumentsView)
  list(@Query('documentId') documentId: string, @CurrentUser() user: RequestUser) {
    return this.versions.listByDocument(user.id, documentId);
  }

  @Post()
  @Permissions(PermissionKey.DocumentsCreate)
  create(@Body() dto: CreateVersionDto, @CurrentUser() user: RequestUser) {
    return this.versions.create(dto, user.id);
  }
}
