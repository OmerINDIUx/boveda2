import { Controller, Get, Param, Post, Req, Res, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { PermissionKey } from '../../common/permissions';
import { CollaboraService } from './collabora.service';

@ApiTags('collabora')
@Controller()
export class CollaboraController {
  constructor(private readonly collabora: CollaboraService) {}

  @Get('collabora/open/:documentId')
  @UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
  @Permissions(PermissionKey.DocumentsView)
  @ApiBearerAuth()
  async open(@Param('documentId') documentId: string, @CurrentUser() user: RequestUser) {
    return this.collabora.openUrl(user.id, documentId);
  }

  @Get('wopi/files/:documentId')
  async checkFileInfo(
    @Param('documentId') documentId: string,
    @Query('access_token') token: string
  ) {
    return this.collabora.checkFileInfo(token, documentId);
  }

  @Get('wopi/files/:documentId/contents')
  async getFile(
    @Param('documentId') documentId: string,
    @Query('access_token') token: string,
    @Res() res: Response
  ) {
    const buffer = await this.collabora.getFile(token, documentId);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment');
    res.send(buffer);
  }

  @Post('wopi/files/:documentId/contents')
  async putFile(
    @Param('documentId') documentId: string,
    @Query('access_token') token: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);
    const result = await this.collabora.putFile(token, documentId, buffer);
    res.json(result);
  }
}
