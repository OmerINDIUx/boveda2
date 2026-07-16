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
import { BitacorasService } from './bitacoras.service';
import { CreateBitacoraEntryDto, PhotoInputDto } from './dto/create-bitacora-entry.dto';
import { UpdateBitacoraEntryDto } from './dto/update-bitacora-entry.dto';
import { BitacoraListQueryDto } from './dto/bitacora-list-query.dto';
import { SignBitacoraEntryDto } from './dto/sign-bitacora-entry.dto';

@ApiTags('bitacoras')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Permissions(PermissionKey.BitacorasView)
@Controller('bitacoras')
export class BitacorasController {
  constructor(private readonly bitacoras: BitacorasService) {}

  @Get()
  list(@CurrentUser() user: RequestUser, @Query() query: BitacoraListQueryDto) {
    return this.bitacoras.listEntries(user, query);
  }

  @Get('form-options')
  formOptions(@CurrentUser() user: RequestUser, @Query('projectId') projectId?: string) {
    return this.bitacoras.getFormOptions(user, projectId);
  }

  @Get('report')
  report(
    @CurrentUser() user: RequestUser,
    @Query('projectId') projectId: string,
    @Query('tipo') tipo: 'semanal' | 'mensual',
    @Query('fecha') fecha: string
  ) {
    return this.bitacoras.getReport(user, projectId, tipo, fecha);
  }

  @Get(':id')
  detail(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.bitacoras.getDetail(user, id);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateBitacoraEntryDto) {
    return this.bitacoras.create(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateBitacoraEntryDto
  ) {
    return this.bitacoras.update(user, id, dto);
  }

  @Post(':id/sign')
  sign(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: SignBitacoraEntryDto
  ) {
    return this.bitacoras.sign(user, id, dto);
  }

  @Delete(':id')
  delete(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.bitacoras.delete(user, id);
  }

  @Post(':id/photos')
  uploadPhoto(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: PhotoInputDto
  ) {
    return this.bitacoras.uploadPhoto(user, id, body);
  }

  @Delete(':id/photos/:photoId')
  deletePhoto(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('photoId') photoId: string
  ) {
    return this.bitacoras.deletePhoto(user, id, photoId);
  }

  @Get(':id/pdf')
  exportPdf(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.bitacoras.exportPdf(user, id);
  }
}
