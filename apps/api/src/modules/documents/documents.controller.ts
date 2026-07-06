import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ActiveUserGuard } from '../../common/guards/active-user.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { PermissionKey } from '../../common/permissions';
import { CreateDocumentCommentDto } from './dto/create-document-comment.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CreateDocumentVersionDto } from './dto/create-document-version.dto';
import { DocumentListQueryDto } from './dto/document-list-query.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentsService } from './documents.service';

function buildContentDisposition(disposition: 'inline' | 'attachment', fileName: string) {
  const fallbackName = fileName.replace(/[^\x20-\x7E]+/g, '_').replace(/["\\]/g, '_') || 'document';
  const encodedName = encodeURIComponent(fileName);
  return `${disposition}; filename="${fallbackName}"; filename*=UTF-8''${encodedName}`;
}

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ActiveUserGuard, PermissionsGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  @Permissions(PermissionKey.DocumentsView)
  list(@CurrentUser() user: RequestUser, @Query() query: DocumentListQueryDto) {
    return this.documents.listVisible(user.id, query);
  }

  @Post()
  @Permissions(PermissionKey.DocumentsCreate)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateDocumentDto) {
    return this.documents.create(user.id, dto);
  }

  @Get(':id')
  @Permissions(PermissionKey.DocumentsView)
  detail(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.documents.getDetail(user.id, id);
  }

  @Get(':id/content')
  @Permissions(PermissionKey.DocumentsView)
  async content(@Param('id') id: string, @CurrentUser() user: RequestUser, @Res() res: Response) {
    const file = await this.documents.getCurrentContent(user.id, id);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', buildContentDisposition('inline', file.fileName));
    res.send(file.buffer);
  }

  @Patch(':id')
  @Permissions(PermissionKey.DocumentsEdit)
  update(@Param('id') id: string, @CurrentUser() user: RequestUser, @Body() dto: UpdateDocumentDto) {
    return this.documents.update(user.id, id, dto);
  }

  @Post(':id/comments')
  @Permissions(PermissionKey.DocumentsView)
  comment(@Param('id') id: string, @CurrentUser() user: RequestUser, @Body() dto: CreateDocumentCommentDto) {
    return this.documents.addComment(user.id, id, dto);
  }

  @Post(':id/versions')
  @Permissions(PermissionKey.DocumentsCreate)
  version(@Param('id') id: string, @CurrentUser() user: RequestUser, @Body() dto: CreateDocumentVersionDto) {
    return this.documents.createVersion(user.id, id, dto);
  }

  @Post(':id/request-approval')
  @Permissions(PermissionKey.DocumentsApprove)
  requestApproval(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.documents.requestApproval(user.id, id);
  }

  @Get(':id/download')
  @Permissions(PermissionKey.DocumentsDownload)
  async download(@Param('id') id: string, @CurrentUser() user: RequestUser, @Res() res: Response) {
    const file = await this.documents.download(user.id, id);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', buildContentDisposition('attachment', file.fileName));
    res.send(file.buffer);
  }

  @Post(':id/print')
  @Permissions(PermissionKey.DocumentsPrint)
  print(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.documents.print(user.id, id);
  }

  @Post(':id/approve')
  @Permissions(PermissionKey.DocumentsApprove)
  approve(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.documents.approve(user.id, id);
  }

  @Post(':id/reject')
  @Permissions(PermissionKey.DocumentsApprove)
  reject(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.documents.reject(user.id, id);
  }

  @Delete(':id')
  @Permissions(PermissionKey.DocumentsDelete)
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.documents.update(user.id, id, { status: 'archived' });
  }
}
