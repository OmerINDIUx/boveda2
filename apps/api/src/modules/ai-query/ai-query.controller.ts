import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { PermissionKey } from '../../common/permissions';
import { AiQueryScheduler } from './ai-query.scheduler';
import { AiQueryService } from './ai-query.service';
import { AskDocumentQueryDto } from './dto/ask-document-query.dto';
import { CreateSessionDto } from './dto/create-session.dto';

@ApiTags('ai-query')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Controller('ai-query')
export class AiQueryController {
  constructor(
    private readonly aiQuery: AiQueryService,
    private readonly scheduler: AiQueryScheduler
  ) {}

  @Post('ask')
  @Permissions(PermissionKey.AiQuery)
  ask(@CurrentUser() user: RequestUser, @Body() dto: AskDocumentQueryDto) {
    return this.aiQuery.ask(user.id, dto);
  }

  @Get('history')
  @Permissions(PermissionKey.AiQuery)
  history(@CurrentUser() user: RequestUser) {
    return this.aiQuery.historyForUser(user.id);
  }

  @Get('sessions')
  @Permissions(PermissionKey.AiQuery)
  listSessions(@CurrentUser() user: RequestUser) {
    return this.aiQuery.listSessions(user.id);
  }

  @Post('sessions')
  @Permissions(PermissionKey.AiQuery)
  createSession(@CurrentUser() user: RequestUser, @Body() dto: CreateSessionDto) {
    return this.aiQuery.createSession(user.id, dto);
  }

  @Get('sessions/:id')
  @Permissions(PermissionKey.AiQuery)
  getSession(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.aiQuery.getSession(user.id, id);
  }

  @Delete('sessions/:id')
  @Permissions(PermissionKey.AiQuery)
  deleteSession(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.aiQuery.deleteSession(user.id, id);
  }

  @Get('sessions/:id/history')
  @Permissions(PermissionKey.AiQuery)
  sessionHistory(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.aiQuery.historyForUser(user.id, id);
  }

  @Post('index/trigger')
  @Permissions(PermissionKey.AiQuery)
  triggerIndexing() {
    return this.scheduler.indexPendingDocuments();
  }

  @Get('index/status')
  @Permissions(PermissionKey.AiQuery)
  indexingStatus() {
    return this.aiQuery.indexingStatus();
  }

  @Get('documents/:id/analysis')
  @Permissions(PermissionKey.DocumentsView)
  documentAnalysis(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.aiQuery.documentAnalysis(user.id, id);
  }

  @Post('documents/:id/analysis/reindex')
  @Permissions(PermissionKey.DocumentsView)
  reindexDocument(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.aiQuery.reindexDocument(user.id, id);
  }
}
