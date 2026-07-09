import { Body, Controller, Get, Headers, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PermissionKey } from '../../common/permissions';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { ProjectEmailsService } from './project-emails.service';
import { InboundProjectEmailDto, SendProjectEmailDto } from './dto/inbound-project-email.dto';

@ApiTags('project-emails')
@Controller('project-emails')
export class ProjectEmailsController {
  constructor(private readonly emails: ProjectEmailsService) {}

  @Public()
  @Post('inbound')
  inboundEmail(@Body() dto: InboundProjectEmailDto, @Headers('x-api-key') apiKey?: string) {
    const expectedKey = process.env.INBOUND_EMAIL_API_KEY;
    if (expectedKey && apiKey !== expectedKey) {
      return { ok: false, reason: 'API key inválida' };
    }
    return this.emails.processInboundEmail(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
  @Permissions(PermissionKey.EmailsView)
  @Get('threads/:projectId')
  listThreads(@Param('projectId') projectId: string) {
    return this.emails.listThreads(projectId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
  @Permissions(PermissionKey.EmailsView)
  @Get('thread/:threadId')
  getThread(@Param('threadId') threadId: string) {
    return this.emails.getThread(threadId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
  @Permissions(PermissionKey.EmailsView)
  @Get('email/:emailId')
  getEmail(@Param('emailId') emailId: string) {
    return this.emails.getEmail(emailId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
  @Permissions(PermissionKey.EmailsManage)
  @Post('send')
  sendEmail(@CurrentUser() user: RequestUser, @Body() dto: SendProjectEmailDto) {
    return this.emails.sendEmail(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
  @Permissions(PermissionKey.EmailsManage)
  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.emails.markAsRead(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
  @Permissions(PermissionKey.EmailsManage)
  @Patch('threads/:id/archive')
  archiveThread(@Param('id') id: string) {
    return this.emails.archiveThread(id);
  }
}
