import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { PermissionKey } from '../../common/permissions';
import { AiQueryService } from './ai-query.service';
import { AskDocumentQueryDto } from './dto/ask-document-query.dto';

@ApiTags('ai-query')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Controller('ai-query')
export class AiQueryController {
  constructor(private readonly aiQuery: AiQueryService) {}

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
}
