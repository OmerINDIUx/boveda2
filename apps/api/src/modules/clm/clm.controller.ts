import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { PermissionKey } from '../../common/permissions';
import { AskContractQueryDto } from './dto/ask-contract-query.dto';
import { CloseContractDto } from './dto/close-contract.dto';
import { CreateContractAttachmentDto } from './dto/create-contract-attachment.dto';
import { CreateContractCommentDto } from './dto/create-contract-comment.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { CreateContractMilestoneDto } from './dto/create-contract-milestone.dto';
import { CreateContractObligationDto } from './dto/create-contract-obligation.dto';
import { CreateContractVersionDto } from './dto/create-contract-version.dto';
import { RenewContractDto } from './dto/renew-contract.dto';
import { UpdateContractMilestoneDto } from './dto/update-contract-milestone.dto';
import { UpdateContractObligationDto } from './dto/update-contract-obligation.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { ClmService } from './clm.service';

@ApiTags('clm')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Controller('clm/contracts')
export class ClmController {
  constructor(private readonly clm: ClmService) {}

  @Get()
  @Permissions(PermissionKey.ContractsManage)
  list(@CurrentUser() user: RequestUser, @Query('projectId') projectId?: string) {
    return this.clm.list(user.id, projectId);
  }

  @Post()
  @Permissions(PermissionKey.ContractsManage)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateContractDto) {
    return this.clm.create(user.id, dto);
  }

  @Get(':id')
  @Permissions(PermissionKey.ContractsManage)
  detail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.clm.getDetail(user.id, id);
  }

  @Patch(':id')
  @Permissions(PermissionKey.ContractsManage)
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateContractDto
  ) {
    return this.clm.update(user.id, id, dto);
  }

  @Post(':id/versions')
  @Permissions(PermissionKey.ContractsManage)
  createVersion(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateContractVersionDto
  ) {
    return this.clm.createVersion(user.id, id, dto);
  }

  @Post(':id/attachments')
  @Permissions(PermissionKey.ContractsManage)
  addAttachment(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateContractAttachmentDto
  ) {
    return this.clm.addAttachment(user.id, id, dto);
  }

  @Post(':id/obligations')
  @Permissions(PermissionKey.ContractsManage)
  addObligation(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateContractObligationDto
  ) {
    return this.clm.addObligation(user.id, id, dto);
  }

  @Patch(':id/obligations/:obligationId')
  @Permissions(PermissionKey.ContractsManage)
  updateObligation(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('obligationId') obligationId: string,
    @Body() dto: UpdateContractObligationDto
  ) {
    return this.clm.updateObligation(user.id, id, obligationId, dto);
  }

  @Post(':id/milestones')
  @Permissions(PermissionKey.ContractsManage)
  addMilestone(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateContractMilestoneDto
  ) {
    return this.clm.addMilestone(user.id, id, dto);
  }

  @Patch(':id/milestones/:milestoneId')
  @Permissions(PermissionKey.ContractsManage)
  updateMilestone(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: UpdateContractMilestoneDto
  ) {
    return this.clm.updateMilestone(user.id, id, milestoneId, dto);
  }

  @Post(':id/comments')
  @Permissions(PermissionKey.ContractsManage)
  addComment(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateContractCommentDto
  ) {
    return this.clm.addComment(user.id, id, dto);
  }

  @Post(':id/close')
  @Permissions(PermissionKey.ContractsManage)
  close(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: CloseContractDto) {
    return this.clm.close(user.id, id, dto);
  }

  @Post(':id/renew')
  @Permissions(PermissionKey.ContractsManage)
  renew(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: RenewContractDto) {
    return this.clm.renew(user.id, id, dto);
  }

  @Post(':id/ask')
  @Permissions(PermissionKey.ContractsManage)
  ask(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: AskContractQueryDto) {
    return this.clm.ask(user.id, id, dto);
  }

  @Post('alerts/sync')
  @Permissions(PermissionKey.ContractsManage)
  syncAlerts(@CurrentUser() user: RequestUser, @Query('projectId') projectId?: string) {
    return this.clm.synchronizeAlerts(user.id, projectId);
  }
}
