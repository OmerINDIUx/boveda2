import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PermissionKey } from '../../common/permissions';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { UploadCatalogsService } from './upload-catalogs.service';
import { BulkUploadsService } from './bulk-uploads.service';
import {
  CreateUploadCatalogDto,
  UpdateUploadCatalogDto,
  BulkUploadStartDto,
  BulkUploadFileDto,
} from './dto/upload-catalog.dto';

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly catalogs: UploadCatalogsService,
    private readonly bulkUploads: BulkUploadsService
  ) {}

  @Get('catalogs')
  listCatalogs(@Param('projectId') projectId?: string) {
    return this.catalogs.list(projectId);
  }

  @Permissions(PermissionKey.ProjectsManage)
  @Post('catalogs')
  createCatalog(@Body() dto: CreateUploadCatalogDto) {
    return this.catalogs.create(dto);
  }

  @Permissions(PermissionKey.ProjectsManage)
  @Patch('catalogs/:id')
  updateCatalog(@Param('id') id: string, @Body() dto: UpdateUploadCatalogDto) {
    return this.catalogs.update(id, dto);
  }

  @Permissions(PermissionKey.BulkUpload)
  @Post('bulk/start')
  startBulk(@CurrentUser() user: RequestUser, @Body() dto: BulkUploadStartDto) {
    return this.bulkUploads.start(dto, user.id);
  }

  @Permissions(PermissionKey.BulkUpload)
  @Post('bulk/:id/files')
  addBulkFiles(@Param('id') id: string, @Body('files') files: BulkUploadFileDto[]) {
    return this.bulkUploads.addFiles(id, files);
  }

  @Permissions(PermissionKey.BulkUpload)
  @Post('bulk/:id/process')
  processBulk(@Param('id') id: string) {
    return this.bulkUploads.processAll(id);
  }

  @Permissions(PermissionKey.BulkUpload)
  @Get('bulk/:id/progress')
  bulkProgress(@Param('id') id: string) {
    return this.bulkUploads.getProgress(id);
  }

  @Permissions(PermissionKey.BulkUpload)
  @Post('bulk/:id/metadata')
  bulkMetadata(@Param('id') id: string, @Body('metadata') metadata: Record<string, unknown>) {
    return this.bulkUploads.markItemsWithMetadata(id, metadata);
  }
}
