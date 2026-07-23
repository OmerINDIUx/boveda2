import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpException,
  Param,
  Patch,
  Post,
  Query,
  RawBodyRequest,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { PermissionKey } from '../../common/permissions';
import { AskContractQueryDto } from './dto/ask-contract-query.dto';
import { AssignTagsDto } from './dto/assign-tags.dto';
import { BatchActionDto } from './dto/batch-action.dto';
import { CloseContractDto } from './dto/close-contract.dto';
import { ContractSearchDto } from './dto/contract-search.dto';
import { CreateAmendmentDto } from './dto/create-amendment.dto';
import { CreateContractAttachmentDto } from './dto/create-contract-attachment.dto';
import { CreateContractAttachmentVersionDto } from './dto/create-contract-attachment-version.dto';
import { CreateClauseDto } from './dto/create-clause.dto';
import { CreateContractCommentDto } from './dto/create-contract-comment.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { CreateCounterpartyDto } from './dto/create-counterparty.dto';
import { UpdateCounterpartyDto } from './dto/update-counterparty.dto';
import { CreateContractRequestDto } from './dto/create-contract-request.dto';
import { ReviewContractRequestDto } from './dto/review-contract-request.dto';
import { CreateContractMilestoneDto } from './dto/create-contract-milestone.dto';
import { CreateContractObligationDto } from './dto/create-contract-obligation.dto';
import { CreateContractVersionDto } from './dto/create-contract-version.dto';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import { CreateNegotiationDto } from './dto/create-negotiation.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { CreateSignatureRequestDto } from './dto/create-signature-request.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { ImportContractsDto } from './dto/import-contracts.dto';
import { RenewContractDto } from './dto/renew-contract.dto';
import { SetCustomValueDto } from './dto/set-custom-value.dto';
import { UpdateAmendmentDto } from './dto/update-amendment.dto';
import { UpdateContractMilestoneDto } from './dto/update-contract-milestone.dto';
import { UpdateContractObligationDto } from './dto/update-contract-obligation.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { UpdateLifecycleStageDto } from './dto/update-lifecycle-stage.dto';
import { UpdateNegotiationDto } from './dto/update-negotiation.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { ClmService } from './clm.service';
import { UpdateContractExtractionDto } from './dto/update-contract-extraction.dto';
import { ApproveContractExtractionDto } from './dto/approve-contract-extraction.dto';
import { AskGotaQueryDto } from './dto/ask-gota-query.dto';
import {
  CreateContractDeliverableDto,
  UpdateContractDeliverableDto,
} from './dto/contract-deliverable.dto';

function buildContentDisposition(disposition: 'inline' | 'attachment', fileName: string) {
  const fallbackName = fileName.replace(/[^\x20-\x7E]+/g, '_').replace(/["\\]/g, '_') || 'contract';
  const encodedName = encodeURIComponent(fileName);
  return `${disposition}; filename="${fallbackName}"; filename*=UTF-8''${encodedName}`;
}

@ApiTags('clm')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Controller('clm')
export class ClmController {
  constructor(private readonly clm: ClmService) {}

  @Get('contracts')
  @Permissions(PermissionKey.ContractsManage)
  list(@CurrentUser() user: RequestUser, @Query() search?: ContractSearchDto) {
    return this.clm.list(user.id, search);
  }

  @Post('contracts')
  @Permissions(PermissionKey.ContractsManage)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateContractDto) {
    return this.clm.create(user.id, dto);
  }

  @Get('contracts/:id')
  @Permissions(PermissionKey.ContractsManage)
  async detail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    try {
      return await this.clm.getDetail(user.id, id);
    } catch (err: unknown) {
      const message = err instanceof Error && err.message ? err.message : 'Internal server error';
      const status =
        typeof err === 'object' &&
        err !== null &&
        'getStatus' in err &&
        typeof err.getStatus === 'function'
          ? err.getStatus()
          : 500;

      throw new HttpException(message, status);
    }
  }

  @Patch('contracts/:id')
  @Permissions(PermissionKey.ContractsManage)
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateContractDto
  ) {
    return this.clm.update(user.id, id, dto);
  }

  @Post('contracts/:id/lifecycle')
  @Permissions(PermissionKey.ApprovalsManage)
  updateLifecycle(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateLifecycleStageDto
  ) {
    return this.clm.updateLifecycleStage(user.id, id, dto);
  }

  @Post('contracts/:id/versions')
  @Permissions(PermissionKey.ContractsManage)
  createVersion(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateContractVersionDto
  ) {
    return this.clm.createVersion(user.id, id, dto);
  }

  @Get('contracts/:id/versions/:versionId/content')
  @Permissions(PermissionKey.ContractsManage)
  async versionContent(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Res() res: Response
  ) {
    const file = await this.clm.getVersionFile(user.id, id, versionId);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', buildContentDisposition('inline', file.fileName));
    res.send(file.buffer);
  }

  @Get('contracts/:id/versions/:versionId/extraction')
  @Permissions(PermissionKey.ContractsManage)
  extraction(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('versionId') versionId: string
  ) {
    return this.clm.getVersionExtraction(user.id, id, versionId);
  }

  @Patch('contracts/:id/versions/:versionId/extraction')
  @Permissions(PermissionKey.ContractsManage)
  updateExtraction(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Body() dto: UpdateContractExtractionDto
  ) {
    return this.clm.updateVersionExtraction(user.id, id, versionId, dto.facts);
  }

  @Post('contracts/:id/versions/:versionId/extraction/start')
  @Permissions(PermissionKey.ContractsManage)
  startExtraction(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('versionId') versionId: string
  ) {
    return this.clm.startVersionExtraction(user.id, id, versionId);
  }

  @Post('contracts/:id/versions/:versionId/extraction/retry')
  @Permissions(PermissionKey.ContractsManage)
  retryExtraction(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('versionId') versionId: string
  ) {
    return this.clm.retryVersionExtraction(user.id, id, versionId);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('contracts/:id/versions/:versionId/extraction/approve')
  @Permissions(PermissionKey.ContractsManage)
  approveExtraction(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Body() dto: ApproveContractExtractionDto
  ) {
    return this.clm.approveVersionExtraction(user.id, id, versionId, dto.password, dto.facts);
  }

  @Get('contracts/:id/versions/:versionId/download')
  @Permissions(PermissionKey.ContractsManage)
  async downloadVersion(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @Res() res: Response
  ) {
    const file = await this.clm.getVersionFile(user.id, id, versionId);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', buildContentDisposition('attachment', file.fileName));
    res.send(file.buffer);
  }

  @Post('contracts/:id/attachments')
  @Permissions(PermissionKey.ContractsManage)
  addAttachment(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateContractAttachmentDto
  ) {
    return this.clm.addAttachment(user.id, id, dto);
  }

  @Post('contracts/:id/attachments/:attachmentId/versions')
  @Permissions(PermissionKey.ContractsManage)
  addAttachmentVersion(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Body() dto: CreateContractAttachmentVersionDto
  ) {
    return this.clm.addAttachmentVersion(user.id, id, attachmentId, dto);
  }

  @Get('contracts/:id/attachments/:attachmentId/extraction')
  @Permissions(PermissionKey.ContractsManage)
  attachmentExtraction(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string
  ) {
    return this.clm.getAttachmentExtraction(user.id, id, attachmentId);
  }

  @Patch('contracts/:id/attachments/:attachmentId/extraction')
  @Permissions(PermissionKey.ContractsManage)
  updateAttachmentExtraction(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Body() dto: UpdateContractExtractionDto
  ) {
    return this.clm.updateAttachmentExtraction(user.id, id, attachmentId, dto.facts);
  }

  @Post('contracts/:id/attachments/:attachmentId/extraction/start')
  @Permissions(PermissionKey.ContractsManage)
  startAttachmentExtraction(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string
  ) {
    return this.clm.startAttachmentExtraction(user.id, id, attachmentId);
  }

  @Post('contracts/:id/attachments/:attachmentId/extraction/retry')
  @Permissions(PermissionKey.ContractsManage)
  retryAttachmentExtraction(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string
  ) {
    return this.clm.retryAttachmentExtraction(user.id, id, attachmentId);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('contracts/:id/attachments/:attachmentId/extraction/approve')
  @Permissions(PermissionKey.ContractsManage)
  approveAttachmentExtraction(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Body() dto: ApproveContractExtractionDto
  ) {
    return this.clm.approveAttachmentExtraction(user.id, id, attachmentId, dto.password, dto.facts);
  }

  @Get('contracts/:id/attachments/:attachmentId/content')
  @Permissions(PermissionKey.ContractsManage)
  async attachmentContent(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Res() res: Response
  ) {
    const file = await this.clm.getAttachmentFile(user.id, id, attachmentId);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', buildContentDisposition('inline', file.fileName));
    res.send(file.buffer);
  }

  @Get('contracts/:id/attachments/:attachmentId/download')
  @Permissions(PermissionKey.ContractsManage)
  async downloadAttachment(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @Res() res: Response
  ) {
    const file = await this.clm.getAttachmentFile(user.id, id, attachmentId);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', buildContentDisposition('attachment', file.fileName));
    res.send(file.buffer);
  }

  @Delete('contracts/:id/attachments/:attachmentId')
  @Permissions(PermissionKey.ContractsManage)
  deleteAttachment(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string
  ) {
    return this.clm.deleteAttachment(user.id, id, attachmentId);
  }

  @Post('contracts/:id/obligations')
  @Permissions(PermissionKey.ContractsManage)
  addObligation(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateContractObligationDto
  ) {
    return this.clm.addObligation(user.id, id, dto);
  }

  @Patch('contracts/:id/obligations/:obligationId')
  @Permissions(PermissionKey.ContractsManage)
  updateObligation(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('obligationId') obligationId: string,
    @Body() dto: UpdateContractObligationDto
  ) {
    return this.clm.updateObligation(user.id, id, obligationId, dto);
  }

  @Post('contracts/:id/obligations/:obligationId/remind')
  @Permissions(PermissionKey.ContractsManage)
  remindObligation(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('obligationId') obligationId: string
  ) {
    return this.clm.remindObligation(user.id, id, obligationId);
  }

  @Get('contracts/:id/calendar')
  @Permissions(PermissionKey.ContractsManage)
  getCalendarEvents(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.clm.getCalendarEvents(user.id, id);
  }

  @Post('contracts/:id/milestones')
  @Permissions(PermissionKey.ContractsManage)
  addMilestone(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateContractMilestoneDto
  ) {
    return this.clm.addMilestone(user.id, id, dto);
  }

  @Patch('contracts/:id/milestones/:milestoneId')
  @Permissions(PermissionKey.ContractsManage)
  updateMilestone(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: UpdateContractMilestoneDto
  ) {
    return this.clm.updateMilestone(user.id, id, milestoneId, dto);
  }

  @Post('contracts/:id/comments')
  @Permissions(PermissionKey.ContractsManage)
  addComment(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateContractCommentDto
  ) {
    return this.clm.addComment(user.id, id, dto);
  }

  @Post('contracts/:id/deliverables')
  @Permissions(PermissionKey.ContractsManage)
  addDeliverable(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateContractDeliverableDto
  ) {
    return this.clm.addDeliverable(user.id, id, dto);
  }

  @Patch('contracts/:id/deliverables/:deliverableId')
  @Permissions(PermissionKey.ContractsManage)
  updateDeliverable(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('deliverableId') deliverableId: string,
    @Body() dto: UpdateContractDeliverableDto
  ) {
    return this.clm.updateDeliverable(user.id, id, deliverableId, dto);
  }

  @Post('contracts/:id/close')
  @Permissions(PermissionKey.ContractsManage)
  close(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: CloseContractDto) {
    return this.clm.close(user.id, id, dto);
  }

  @Post('contracts/:id/renew')
  @Permissions(PermissionKey.ContractsManage)
  renew(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: RenewContractDto) {
    return this.clm.renew(user.id, id, dto);
  }

  @Post('contracts/:id/ask')
  @Permissions(PermissionKey.ContractsManage)
  ask(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: AskContractQueryDto) {
    return this.clm.ask(user.id, id, dto);
  }

  @Post('gota/ask')
  @Permissions(PermissionKey.ContractsManage)
  askGota(@CurrentUser() user: RequestUser, @Body() dto: AskGotaQueryDto) {
    return this.clm.askGota(user.id, dto);
  }

  @Get('gota/sources')
  @Permissions(PermissionKey.ContractsManage)
  listGotaSources(@CurrentUser() user: RequestUser) {
    return this.clm.listGotaSources(user.id);
  }

  @Get('gota/sources/:versionId/knowledge')
  @Permissions(PermissionKey.ContractsManage)
  getGotaKnowledge(@CurrentUser() user: RequestUser, @Param('versionId') versionId: string) {
    return this.clm.getGotaKnowledge(user.id, versionId);
  }

  @Post('gota/sources/:versionId/normalize-transcription')
  @Permissions(PermissionKey.ContractsManage)
  normalizeGotaTranscription(
    @CurrentUser() user: RequestUser,
    @Param('versionId') versionId: string
  ) {
    return this.clm.normalizeGotaTranscription(user.id, versionId);
  }

  @Post('contracts/:id/amendments')
  @Permissions(PermissionKey.ContractsManage)
  addAmendment(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateAmendmentDto
  ) {
    return this.clm.addAmendment(user.id, id, dto);
  }

  @Patch('contracts/:id/amendments/:amendmentId')
  @Permissions(PermissionKey.ContractsManage)
  updateAmendment(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('amendmentId') amendmentId: string,
    @Body() dto: UpdateAmendmentDto
  ) {
    return this.clm.updateAmendment(user.id, id, amendmentId, dto);
  }

  @Post('contracts/:id/payments')
  @Permissions(PermissionKey.ClmFinance)
  addPayment(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreatePaymentDto
  ) {
    return this.clm.addPayment(user.id, id, dto);
  }

  @Patch('contracts/:id/payments/:paymentId')
  @Permissions(PermissionKey.ClmFinance)
  updatePayment(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
    @Body() dto: UpdatePaymentDto
  ) {
    return this.clm.updatePayment(user.id, id, paymentId, dto);
  }

  @Get('contracts/:id/payments/:paymentId/proof')
  @Permissions(PermissionKey.ClmFinance)
  async downloadPaymentProof(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
    @Res() res: Response
  ) {
    const file = await this.clm.getPaymentProof(user.id, id, paymentId);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', buildContentDisposition('attachment', file.fileName));
    res.send(file.buffer);
  }

  @Post('contracts/:id/payments/:paymentId/sync-erp')
  @Permissions(PermissionKey.ClmFinance)
  syncPaymentToErp(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('paymentId') paymentId: string
  ) {
    return this.clm.syncPaymentToErp(user.id, id, paymentId);
  }

  @Get('integrations/status')
  @Permissions(PermissionKey.ContractsManage)
  integrationStatus() {
    return this.clm.getIntegrationStatus();
  }

  @Post('integrations/erp/test')
  @Permissions(PermissionKey.ClmFinance)
  testErpConnection() {
    return this.clm.testErpConnection();
  }

  @Post('contracts/:id/signatures')
  @Permissions(PermissionKey.ClmSign)
  sendForSignature(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateSignatureRequestDto
  ) {
    return this.clm.sendForSignature(user.id, id, dto);
  }

  @Get('contracts/:id/signatures/:signatureId')
  @Permissions(PermissionKey.ClmSign)
  checkSignatureStatus(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('signatureId') signatureId: string
  ) {
    return this.clm.checkSignatureStatus(user.id, id, signatureId);
  }

  @Post('contracts/:id/negotiations')
  @Permissions(PermissionKey.ContractsManage)
  addNegotiation(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateNegotiationDto
  ) {
    return this.clm.addNegotiation(user.id, id, dto);
  }

  @Patch('contracts/:id/negotiations/:negotiationId')
  @Permissions(PermissionKey.ContractsManage)
  updateNegotiation(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('negotiationId') negotiationId: string,
    @Body() dto: UpdateNegotiationDto
  ) {
    return this.clm.updateNegotiation(user.id, id, negotiationId, dto);
  }

  @Post('contracts/:id/tags')
  @Permissions(PermissionKey.ContractsManage)
  assignTags(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: AssignTagsDto
  ) {
    return this.clm.assignTags(user.id, id, dto);
  }

  @Post('contracts/:id/custom-values')
  @Permissions(PermissionKey.ContractsManage)
  setCustomValue(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: SetCustomValueDto
  ) {
    return this.clm.setCustomValue(user.id, id, dto);
  }

  @Post('contracts/:id/custom-values/batch')
  @Permissions(PermissionKey.ContractsManage)
  setCustomValues(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() values: SetCustomValueDto[]
  ) {
    return this.clm.setCustomValues(user.id, id, values);
  }

  @Patch('contracts/:id/parent')
  @Permissions(PermissionKey.ContractsManage)
  setParent(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body('parentContractId') parentContractId: string | null
  ) {
    return this.clm.setParentContract(user.id, id, parentContractId);
  }

  @Post('contracts/batch')
  @Permissions(PermissionKey.ContractsManage)
  batch(@CurrentUser() user: RequestUser, @Body() dto: BatchActionDto) {
    return this.clm.batchAction(user.id, dto);
  }

  @Post('contracts/import')
  @Permissions(PermissionKey.ClmImport)
  importContracts(@CurrentUser() user: RequestUser, @Body() dto: ImportContractsDto) {
    return this.clm.importContracts(user.id, dto);
  }

  @Get('contracts/:id/risk-matrix')
  @Permissions(PermissionKey.ContractsManage)
  getRiskMatrix(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.clm.getRiskMatrix(user.id, id);
  }

  @Get('contracts/:id/export')
  @Permissions(PermissionKey.ClmExport)
  exportContract(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.clm.exportContract(user.id, id);
  }

  @Post('alerts/sync')
  @Permissions(PermissionKey.ContractsManage)
  syncAlerts(@CurrentUser() user: RequestUser, @Query('projectId') projectId?: string) {
    return this.clm.synchronizeAlerts(user.id, projectId);
  }

  @Get('alerts')
  @Permissions(PermissionKey.ContractsManage)
  listAlerts(@CurrentUser() user: RequestUser) {
    return this.clm.listAlerts(user.id);
  }

  @Post('alerts/:id/dismiss')
  @Permissions(PermissionKey.ContractsManage)
  dismissAlert(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.clm.dismissAlert(user.id, id);
  }

  @Get('dashboard')
  @Permissions(PermissionKey.ContractsManage)
  dashboard(@CurrentUser() user: RequestUser, @Query('projectId') projectId?: string) {
    return this.clm.getDashboard(user.id, projectId);
  }

  @Post('reports')
  @Permissions(PermissionKey.ClmReports)
  report(@CurrentUser() user: RequestUser, @Body() dto: CreateReportDto) {
    return this.clm.generateReport(user.id, dto);
  }

  @Get('tags')
  @Permissions(PermissionKey.ContractsManage)
  listTags() {
    return this.clm.listTags();
  }

  @Post('tags')
  @Permissions(PermissionKey.ContractsManage)
  createTag(@Body() dto: CreateTagDto) {
    return this.clm.createTag('system', dto);
  }

  @Delete('tags/:id')
  @Permissions(PermissionKey.ContractsManage)
  deleteTag(@Param('id') id: string) {
    return this.clm.deleteTag(id);
  }

  @Get('custom-fields')
  @Permissions(PermissionKey.ContractsManage)
  listCustomFields(@Query('contractType') contractType?: string) {
    return this.clm.listCustomFields(contractType);
  }

  @Post('custom-fields')
  @Permissions(PermissionKey.ContractsManage)
  createCustomField(@Body() dto: CreateCustomFieldDto) {
    return this.clm.createCustomField(dto);
  }

  @Delete('custom-fields/:id')
  @Permissions(PermissionKey.ContractsManage)
  deleteCustomField(@Param('id') id: string) {
    return this.clm.deleteCustomField(id);
  }

  @Get('templates')
  @Permissions(PermissionKey.ClmTemplates)
  listTemplates() {
    return this.clm.listTemplates();
  }

  @Post('templates')
  @Permissions(PermissionKey.ClmTemplates)
  createTemplate(@CurrentUser() user: RequestUser, @Body() dto: CreateTemplateDto) {
    return this.clm.createTemplate(user.id, dto);
  }

  @Get('templates/:id')
  @Permissions(PermissionKey.ClmTemplates)
  templateDetail(@Param('id') id: string) {
    return this.clm.getTemplateDetail(id);
  }

  @Post('templates/:id/generate')
  @Permissions(PermissionKey.ContractsManage)
  generateFromTemplate(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: Record<string, string>
  ) {
    return this.clm.generateFromTemplate(user.id, id, dto);
  }

  @Post('templates/:id/new-version')
  @Permissions(PermissionKey.ContractsManage)
  createTemplateVersion(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateTemplateDto
  ) {
    return this.clm.createTemplateVersion(user.id, id, dto);
  }

  @Get('clauses')
  @Permissions(PermissionKey.ClmTemplates)
  listClauses(@Query('category') category?: string) {
    return this.clm.listClauses(category);
  }

  @Post('clauses')
  @Permissions(PermissionKey.ClmTemplates)
  createClause(@CurrentUser() user: RequestUser, @Body() dto: CreateClauseDto) {
    return this.clm.createClause(user.id, dto);
  }

  @Get('import-logs')
  @Permissions(PermissionKey.ClmImport)
  importLogs(@CurrentUser() user: RequestUser) {
    return this.clm.listImportLogs(user.id);
  }

  @Get('counterparties')
  @Permissions(PermissionKey.ContractsManage)
  listCounterparties(@CurrentUser() user: RequestUser, @Query('search') search?: string) {
    return this.clm.listCounterparties(user.id, search);
  }

  @Post('counterparties')
  @Permissions(PermissionKey.ContractsManage)
  createCounterparty(@CurrentUser() user: RequestUser, @Body() dto: CreateCounterpartyDto) {
    return this.clm.createCounterparty(user.id, dto);
  }

  @Get('counterparties/:id')
  @Permissions(PermissionKey.ContractsManage)
  getCounterparty(@Param('id') id: string) {
    return this.clm.getCounterparty(id);
  }

  @Patch('counterparties/:id')
  @Permissions(PermissionKey.ContractsManage)
  updateCounterparty(@Param('id') id: string, @Body() dto: UpdateCounterpartyDto) {
    return this.clm.updateCounterparty(id, dto);
  }

  @Delete('counterparties/:id')
  @Permissions(PermissionKey.ContractsManage)
  deleteCounterparty(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.clm.deleteCounterparty(user.id, id);
  }

  @Get('requests')
  @Permissions(PermissionKey.ContractsManage)
  listRequests(@CurrentUser() user: RequestUser) {
    return this.clm.listRequests(user.id);
  }

  @Post('requests')
  @Permissions(PermissionKey.ContractsManage)
  createRequest(@CurrentUser() user: RequestUser, @Body() dto: CreateContractRequestDto) {
    return this.clm.createRequest(user.id, dto);
  }

  @Get('requests/:id')
  @Permissions(PermissionKey.ContractsManage)
  getRequest(@Param('id') id: string) {
    return this.clm.getRequest(id);
  }

  @Patch('requests/:id/review')
  @Permissions(PermissionKey.ContractsManage)
  reviewRequest(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: ReviewContractRequestDto
  ) {
    return this.clm.reviewRequest(user.id, id, dto);
  }

  @Post('requests/:id/convert')
  @Permissions(PermissionKey.ContractsManage)
  convertRequest(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.clm.convertRequest(user.id, id);
  }

  @Post('signatures/webhook/docusign')
  @Public()
  docusignWebhook(
    @Body() payload: Record<string, unknown>,
    @Req() request: RawBodyRequest<Request>,
    @Headers('x-docusign-signature-1') signature: string
  ) {
    return this.clm.handleSignatureWebhook(
      'docusign',
      payload,
      request.rawBody ?? Buffer.alloc(0),
      signature
    );
  }

  @Get('search')
  @Permissions(PermissionKey.ContractsManage)
  searchContracts(
    @CurrentUser() user: RequestUser,
    @Query('q') query: string,
    @Query('projectId') projectId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.clm.searchContracts(user.id, query, projectId, page, limit);
  }

  @Post('contracts/:id/reindex')
  @Permissions(PermissionKey.ContractsManage)
  reindexContract(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.clm.reindexContractText(user.id, id);
  }
}
