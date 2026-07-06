import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import { ApprovalFlow } from '../approvals/approval-flow.entity';
import { ApprovalRequest } from '../approvals/approval-request.entity';
import { ProjectMember } from '../projects/project-member.entity';
import { ProjectsModule } from '../projects/projects.module';
import { User } from '../users/user.entity';
import { DocumentVersion } from '../versions/document-version.entity';
import { StorageModule } from '../../storage/storage.module';
import { Folder } from '../folders/folder.entity';
import { DocumentAuditLog } from './document-audit-log.entity';
import { DocumentChunk } from './document-chunk.entity';
import { DocumentComment } from './document-comment.entity';
import { DocumentEmbedding } from './document-embedding.entity';
import { DocumentRecord } from './document.entity';
import { DocumentMetadata } from './document-metadata.entity';
import { DocumentPermission } from './document-permission.entity';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [
    ProjectsModule,
    StorageModule,
    NotificationsModule,
    TypeOrmModule.forFeature([
      DocumentRecord,
      ApprovalFlow,
      ApprovalRequest,
      DocumentVersion,
      DocumentMetadata,
      DocumentPermission,
      DocumentAuditLog,
      DocumentComment,
      DocumentChunk,
      DocumentEmbedding,
      User,
      ProjectMember,
      Folder
    ])
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService]
})
export class DocumentsModule {}
