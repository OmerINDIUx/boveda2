import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { PermissionKey } from '../../common/permissions';
import { ApprovalActionDto } from './dto/approval-action.dto';
import { CreateApprovalFlowDto } from './dto/create-approval-flow.dto';
import { CreateApprovalRequestDto } from './dto/create-approval-request.dto';
import { UpdateApprovalFlowDto } from './dto/update-approval-flow.dto';
import { ApprovalsService } from './approvals.service';

@ApiTags('approvals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly approvals: ApprovalsService) {}

  @Get('flows')
  @Permissions(PermissionKey.ApprovalsManage)
  listFlows(@CurrentUser() user: RequestUser, @Query('projectId') projectId: string) {
    return this.approvals.listFlows(user.id, projectId);
  }

  @Post('flows')
  @Permissions(PermissionKey.ApprovalsManage)
  createFlow(@CurrentUser() user: RequestUser, @Body() dto: CreateApprovalFlowDto) {
    return this.approvals.createFlow(user.id, dto);
  }

  @Get('flows/:id')
  @Permissions(PermissionKey.ApprovalsManage)
  flowDetail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.approvals.getFlowDetail(user.id, id);
  }

  @Patch('flows/:id')
  @Permissions(PermissionKey.ApprovalsManage)
  updateFlow(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateApprovalFlowDto) {
    return this.approvals.updateFlow(user.id, id, dto);
  }

  @Patch('flows/:id/deactivate')
  @Permissions(PermissionKey.ApprovalsManage)
  deactivateFlow(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.approvals.deactivateFlow(user.id, id);
  }

  @Post('requests')
  @Permissions(PermissionKey.DocumentsApprove)
  startRequest(@CurrentUser() user: RequestUser, @Body() dto: CreateApprovalRequestDto) {
    return this.approvals.startDocumentApproval(user.id, dto);
  }

  @Get('requests/pending')
  @Permissions(PermissionKey.DocumentsApprove)
  pending(@CurrentUser() user: RequestUser) {
    return this.approvals.listPendingForUser(user.id, user.roles);
  }

  @Get('requests/history')
  @Permissions(PermissionKey.DocumentsApprove)
  history(@CurrentUser() user: RequestUser, @Query('documentId') documentId?: string) {
    return this.approvals.listHistory(user.id, documentId);
  }

  @Get('requests/:id')
  @Permissions(PermissionKey.DocumentsApprove)
  detail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.approvals.getRequestDetail(user.id, id);
  }

  @Post('requests/:id/approve')
  @Permissions(PermissionKey.DocumentsApprove)
  approve(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: ApprovalActionDto) {
    return this.approvals.approve(user.id, user.roles, id, dto);
  }

  @Post('requests/:id/reject')
  @Permissions(PermissionKey.DocumentsApprove)
  reject(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: ApprovalActionDto) {
    return this.approvals.reject(user.id, user.roles, id, dto);
  }

  @Post('requests/:id/request-changes')
  @Permissions(PermissionKey.DocumentsApprove)
  requestChanges(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: ApprovalActionDto) {
    return this.approvals.requestChanges(user.id, user.roles, id, dto);
  }

  @Post('requests/:id/comment')
  @Permissions(PermissionKey.DocumentsApprove)
  comment(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: ApprovalActionDto) {
    return this.approvals.comment(user.id, id, dto);
  }
}
