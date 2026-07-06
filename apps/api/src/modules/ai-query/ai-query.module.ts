import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { DocumentChunk } from '../documents/document-chunk.entity';
import { DocumentEmbedding } from '../documents/document-embedding.entity';
import { DocumentPermission } from '../documents/document-permission.entity';
import { DocumentRecord } from '../documents/document.entity';
import { DocumentsModule } from '../documents/documents.module';
import { ProjectMember } from '../projects/project-member.entity';
import { ProjectsModule } from '../projects/projects.module';
import { StorageModule } from '../../storage/storage.module';
import { User } from '../users/user.entity';
import { DocumentVersion } from '../versions/document-version.entity';
import { AiQueryController } from './ai-query.controller';
import { DocumentIndexingService } from './document-indexing.service';
import { DocumentQueryHistory } from './document-query-history.entity';
import { AiQueryService } from './ai-query.service';
import { OllamaChatService } from './ollama-chat.service';

@Module({
  imports: [
    DocumentsModule,
    ProjectsModule,
    AuditModule,
    StorageModule,
    TypeOrmModule.forFeature([
      DocumentRecord,
      DocumentVersion,
      DocumentChunk,
      DocumentEmbedding,
      DocumentPermission,
      DocumentQueryHistory,
      User,
      ProjectMember
    ])
  ],
  controllers: [AiQueryController],
  providers: [AiQueryService, DocumentIndexingService, OllamaChatService]
})
export class AiQueryModule {}
