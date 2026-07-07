import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
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
import { CreateClauseDto } from './dto/create-clause.dto';
import { CreateContractCommentDto } from './dto/create-contract-comment.dto';
import { CreateContractDto } from './dto/create-contract.dto';
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
import { UpdateNegotiationDto } from './dto/update-negotiation.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { ClmService } from './clm.service';

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
  detail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.clm.getDetail(user.id, id);
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

  @Post('contracts/:id/versions')
  @Permissions(PermissionKey.ContractsManage)
  createVersion(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateContractVersionDto
  ) {
    return this.clm.createVersion(user.id, id, dto);
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
}
