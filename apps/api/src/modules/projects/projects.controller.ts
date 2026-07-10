import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { PermissionKey } from '../../common/permissions';
import { AssignProjectUserDto } from './dto/assign-project-user.dto';
import { CheckCatalogSynonymsDto } from './dto/check-catalog-synonyms.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { SearchCatalogSynonymsDto } from './dto/search-catalog-synonyms.dto';
import { CreateProjectCatalogOptionDto } from './dto/create-project-catalog-option.dto';
import { ProjectDocumentsQueryDto } from './dto/project-documents-query.dto';
import { UpdateProjectCatalogOptionDto } from './dto/update-project-catalog-option.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @Permissions(PermissionKey.ProjectsView)
  list(@CurrentUser() user: RequestUser) {
    return this.projects.listForUser(user.id);
  }

  @Get('form-options')
  @Permissions(PermissionKey.ProjectsManage)
  formOptions(@CurrentUser() user: RequestUser) {
    return this.projects.getFormOptions(user.id);
  }

  @Get('catalog-options')
  @Permissions(PermissionKey.ProjectsManage)
  catalogOptions() {
    return this.projects.listCatalogOptions();
  }

  @Post('catalog-options')
  @Permissions(PermissionKey.ProjectsManage)
  createCatalogOption(
    @Body() dto: CreateProjectCatalogOptionDto,
    @CurrentUser() user: RequestUser
  ) {
    return this.projects.createCatalogOption(user.id, dto);
  }

  @Post('catalog-options/check-synonyms')
  @Permissions(PermissionKey.ProjectsManage)
  checkSynonyms(@Body() dto: CheckCatalogSynonymsDto) {
    return this.projects.checkSynonyms(dto);
  }

  @Post('catalog-options/search-synonyms')
  @Permissions(PermissionKey.ProjectsManage)
  searchSynonyms(@Body() dto: SearchCatalogSynonymsDto) {
    return this.projects.searchSynonyms(dto);
  }

  @Patch('catalog-options/:id')
  @Permissions(PermissionKey.ProjectsManage)
  updateCatalogOption(
    @Param('id') id: string,
    @Body() dto: UpdateProjectCatalogOptionDto,
    @CurrentUser() user: RequestUser
  ) {
    return this.projects.updateCatalogOption(user.id, id, dto);
  }

  @Patch('catalog-options/:id/deactivate')
  @Permissions(PermissionKey.ProjectsManage)
  deactivateCatalogOption(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.projects.deactivateCatalogOption(user.id, id);
  }

  @Post()
  @Permissions(PermissionKey.ProjectsManage)
  create(@Body() dto: CreateProjectDto, @CurrentUser() user: RequestUser) {
    return this.projects.create(dto, user.id);
  }

  @Get('drafts')
  @Permissions(PermissionKey.ProjectsManage)
  listDrafts(@CurrentUser() user: RequestUser) {
    return this.projects.listDrafts(user.id);
  }

  @Patch(':id/publish')
  @Permissions(PermissionKey.ProjectsManage)
  publishDraft(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.projects.publishDraft(user.id, id);
  }

  @Get(':id')
  @Permissions(PermissionKey.ProjectsView)
  detail(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.projects.getDetail(user.id, id);
  }

  @Get(':id/documents')
  @Permissions(PermissionKey.ProjectsView)
  documents(
    @Param('id') id: string,
    @Query() query: ProjectDocumentsQueryDto,
    @CurrentUser() user: RequestUser
  ) {
    return this.projects.getProjectDocuments(user.id, id, query);
  }

  @Patch(':id')
  @Permissions(PermissionKey.ProjectsManage)
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto, @CurrentUser() user: RequestUser) {
    return this.projects.update(user.id, id, dto);
  }

  @Patch(':id/deactivate')
  @Permissions(PermissionKey.ProjectsManage)
  deactivate(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.projects.deactivate(user.id, id);
  }

  @Get(':id/users')
  @Permissions(PermissionKey.ProjectsManage)
  listMembers(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.projects.listMembers(user.id, id);
  }

  @Post(':id/users')
  @Permissions(PermissionKey.ProjectsManage)
  assignUser(
    @Param('id') id: string,
    @Body() dto: AssignProjectUserDto,
    @CurrentUser() user: RequestUser
  ) {
    return this.projects.assignUser(user.id, id, dto);
  }
}
