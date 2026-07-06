import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
import { RespondRfiDto } from './dto/respond-rfi.dto';
import { RfiListQueryDto } from './dto/rfi-list-query.dto';
import { UpdateRfiStatusDto } from './dto/update-rfi-status.dto';
import { RfisService } from './rfis.service';

@ApiTags('rfis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Permissions(PermissionKey.RfisManage)
@Controller('rfis')
export class RfisController {
  constructor(private readonly rfis: RfisService) {}

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
