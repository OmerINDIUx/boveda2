import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { PermissionKey } from '../../common/permissions';
import { ContractRecordsService } from './contract-records.service';
import {
  ContractRecordActionDto,
  CreateContractRecordDto,
  UpdateContractRecordDto,
} from './dto/contract-record.dto';
import { ContractRecordType } from './entities/contract-record.entity';

@ApiTags('clm-contract-records')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Controller('clm/contracts/:contractId/records')
export class ContractRecordsController {
  constructor(private readonly service: ContractRecordsService) {}

  @Get()
  @Permissions(PermissionKey.ContractsManage)
  list(
    @CurrentUser() user: RequestUser,
    @Param('contractId') contractId: string,
    @Query('type') type?: ContractRecordType
  ) {
    return this.service.list(user.id, contractId, type);
  }

  @Post()
  @Permissions(PermissionKey.ContractsManage)
  create(
    @CurrentUser() user: RequestUser,
    @Param('contractId') contractId: string,
    @Body() dto: CreateContractRecordDto
  ) {
    return this.service.create(user.id, contractId, dto);
  }

  @Patch(':recordId')
  @Permissions(PermissionKey.ContractsManage)
  update(
    @CurrentUser() user: RequestUser,
    @Param('contractId') contractId: string,
    @Param('recordId') recordId: string,
    @Body() dto: UpdateContractRecordDto
  ) {
    return this.service.update(user.id, contractId, recordId, dto);
  }

  @Post(':recordId/submit')
  @Permissions(PermissionKey.ContractsManage)
  submit(
    @CurrentUser() user: RequestUser,
    @Param('contractId') contractId: string,
    @Param('recordId') recordId: string,
    @Body() dto: ContractRecordActionDto
  ) {
    return this.service.submit(user.id, contractId, recordId, dto);
  }

  @Post(':recordId/approve')
  @Permissions(PermissionKey.ApprovalsManage)
  approve(
    @CurrentUser() user: RequestUser,
    @Param('contractId') contractId: string,
    @Param('recordId') recordId: string,
    @Body() dto: ContractRecordActionDto
  ) {
    return this.service.decide(user.id, contractId, recordId, 'approved', dto);
  }

  @Post(':recordId/reject')
  @Permissions(PermissionKey.ApprovalsManage)
  reject(
    @CurrentUser() user: RequestUser,
    @Param('contractId') contractId: string,
    @Param('recordId') recordId: string,
    @Body() dto: ContractRecordActionDto
  ) {
    return this.service.decide(user.id, contractId, recordId, 'rejected', dto);
  }

  @Post(':recordId/request-changes')
  @Permissions(PermissionKey.ApprovalsManage)
  requestChanges(
    @CurrentUser() user: RequestUser,
    @Param('contractId') contractId: string,
    @Param('recordId') recordId: string,
    @Body() dto: ContractRecordActionDto
  ) {
    return this.service.decide(user.id, contractId, recordId, 'changes_requested', dto);
  }
}
