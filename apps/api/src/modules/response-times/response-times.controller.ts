import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PermissionKey } from '../../common/permissions';
import { ResponseTimesService } from './response-times.service';
import { CreateSlaDto, UpdateSlaDto, CreateWorkflowActionDto } from './dto/sla.dto';

@ApiTags('response-times')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Permissions(PermissionKey.SlaManage)
@Controller('response-times')
export class ResponseTimesController {
  constructor(private readonly service: ResponseTimesService) {}

  @Get('slas/:projectId')
  listSlas(@Param('projectId') projectId: string) {
    return this.service.listSlas(projectId);
  }

  @Post('slas')
  createSla(@Body() dto: CreateSlaDto) {
    return this.service.createSla(dto);
  }

  @Patch('slas/:id')
  updateSla(@Param('id') id: string, @Body() dto: UpdateSlaDto) {
    return this.service.updateSla(id, dto);
  }

  @Get('metrics/:projectId')
  getMetrics(@Param('projectId') projectId: string) {
    return this.service.getMetrics(projectId);
  }

  @Get('workflows/:projectId')
  listWorkflows(@Param('projectId') projectId: string) {
    return this.service.listWorkflows(projectId);
  }

  @Post('workflows')
  createWorkflow(@Body() dto: CreateWorkflowActionDto) {
    return this.service.createWorkflow(dto);
  }

  @Get('check/:emailId/:slaId')
  checkSla(@Param('emailId') emailId: string, @Param('slaId') slaId: string) {
    return this.service.checkSlaStatus(emailId, slaId);
  }
}
