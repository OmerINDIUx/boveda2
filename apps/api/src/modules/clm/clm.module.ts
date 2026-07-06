import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../../storage/storage.module';
import { DocumentRecord } from '../documents/document.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProjectsModule } from '../projects/projects.module';
import { ClmController } from './clm.controller';
import { ClmService } from './clm.service';
import { ContractAttachment } from './contract-attachment.entity';
import { ContractAuditLog } from './contract-audit-log.entity';
import { ContractComment } from './contract-comment.entity';
import { Contract } from './contract.entity';
import { ContractMilestone } from './contract-milestone.entity';
import { ContractObligation } from './contract-obligation.entity';
import { ContractVersion } from './contract-version.entity';
import { DocumentVersion } from '../versions/document-version.entity';

@Module({
  imports: [
    ProjectsModule,
    StorageModule,
    NotificationsModule,
    TypeOrmModule.forFeature([
      Contract,
      ContractVersion,
      ContractAttachment,
      ContractObligation,
      ContractMilestone,
      ContractComment,
      ContractAuditLog,
      DocumentRecord,
      DocumentVersion,
    ]),
  ],
  controllers: [ClmController],
  providers: [ClmService],
})
export class ClmModule {}
