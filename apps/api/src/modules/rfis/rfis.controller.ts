import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { PermissionKey } from '../../common/permissions';
import { CreateRfiCommentDto } from './dto/create-rfi-comment.dto';
import { CreateRfiDto } from './dto/create-rfi.dto';
import { CreateRfiTemplateDto } from './dto/create-rfi-template.dto';
import { InboundEmailDto } from './dto/inbound-email.dto';
import { RespondRfiDto } from './dto/respond-rfi.dto';
import { RfiListQueryDto } from './dto/rfi-list-query.dto';
import { UpdateRfiStatusDto } from './dto/update-rfi-status.dto';
import { UpdateRfiTemplateDto } from './dto/update-rfi-template.dto';
import { RfisService } from './rfis.service';

@ApiTags('rfis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Permissions(PermissionKey.RfisManage)
@Controller('rfis')
export class RfisController {
  constructor(private readonly rfis: RfisService) {}

  // ─── RFI Templates (must be before :id routes) ─────────────────────

  @Get('templates')
  listTemplates(@CurrentUser() user: RequestUser, @Query('projectId') projectId?: string) {
    return this.rfis.listTemplates(user, projectId);
  }

  @Get('templates/:id')
  getTemplate(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.rfis.getTemplate(user, id);
  }

  @Post('templates')
  createTemplate(@CurrentUser() user: RequestUser, @Body() dto: CreateRfiTemplateDto) {
    return this.rfis.createTemplate(user, dto);
  }

  @Patch('templates/:id')
  updateTemplate(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateRfiTemplateDto
  ) {
    return this.rfis.updateTemplate(user, id, dto);
  }

  @Delete('templates/:id')
  deleteTemplate(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.rfis.deleteTemplate(user, id);
  }

  @Post('templates/:id/evaluate')
  evaluateTemplate(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body('projectId') projectId: string
  ) {
    return this.rfis.evaluateTemplate(user, id, projectId);
  }

  // ─── Inbound Email (sin JWT, protegido por API key) ────────────────

  @Public()
  @Post('inbound-email')
  inboundEmail(@Body() dto: InboundEmailDto, @Headers('x-api-key') apiKey?: string) {
    const expectedKey = process.env.INBOUND_API_KEY;
    if (expectedKey && apiKey !== expectedKey) {
      return { ok: false, reason: 'API key inválida' };
    }
    return this.rfis.processInboundEmail(dto);
  }

  @Get('form-options')
  formOptions(@CurrentUser() user: RequestUser, @Query('projectId') projectId?: string) {
    return this.rfis.getFormOptions(user, projectId);
  }

  @Get()
  list(@CurrentUser() user: RequestUser, @Query() query: RfiListQueryDto) {
    return this.rfis.list(user, query);
  }

  @Get(':id')
  detail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.rfis.getDetail(user, id);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateRfiDto) {
    return this.rfis.create(user, dto);
  }

  @Post(':id/comments')
  comment(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: CreateRfiCommentDto
  ) {
    return this.rfis.addComment(user, id, dto);
  }

  @Post(':id/respond')
  respond(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: RespondRfiDto) {
    return this.rfis.respond(user, id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateRfiStatusDto
  ) {
    return this.rfis.updateStatus(user, id, dto);
  }

  @Patch(':id/close')
  close(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body('note') note?: string) {
    return this.rfis.close(user, id, note);
  }
}
