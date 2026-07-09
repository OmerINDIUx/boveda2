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
import { PermissionKey } from '../../common/permissions';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { NomenclaturesService } from './nomenclatures.service';
import { CreateNomenclatureDto, UpdateNomenclatureDto } from './dto/create-nomenclature.dto';

@ApiTags('nomenclatures')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Permissions(PermissionKey.NomenclaturesManage)
@Controller('nomenclatures')
export class NomenclaturesController {
  constructor(private readonly nomenclatures: NomenclaturesService) {}

  @Get()
  list(@Query('projectId') projectId: string) {
    return this.nomenclatures.list(projectId);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.nomenclatures.getById(id);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateNomenclatureDto) {
    return this.nomenclatures.create(dto, user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNomenclatureDto) {
    return this.nomenclatures.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.nomenclatures.remove(id);
  }

  @Post(':id/preview')
  preview(@Param('id') id: string, @Body('context') context: Record<string, string>) {
    return this.nomenclatures.preview(id, context);
  }
}
