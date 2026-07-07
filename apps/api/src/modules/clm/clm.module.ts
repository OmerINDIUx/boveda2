import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../../storage/storage.module';
import { DocumentRecord } from '../documents/document.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProjectsModule } from '../projects/projects.module';
import { ClmController } from './clm.controller';
import { ClmService } from './clm.service';
import { ContractAmendment } from './entities/contract-amendment.entity';
import { ContractAttachment } from './contract-attachment.entity';
import { ContractAuditLog } from './contract-audit-log.entity';
import { ContractClause } from './entities/contract-clause.entity';
import { ContractComment } from './contract-comment.entity';
import { ContractCustomField } from './entities/contract-custom-field.entity';
import { ContractCustomValue } from './entities/contract-custom-value.entity';
import { ContractImportLog } from './entities/contract-import-log.entity';
import { Contract } from './contract.entity';
import { ContractMilestone } from './contract-milestone.entity';
import { ContractNegotiation } from './entities/contract-negotiation.entity';
import { ContractObligation } from './contract-obligation.entity';
import { ContractPayment } from './entities/contract-payment.entity';
import { ContractSignatureRequest } from './entities/contract-signature-request.entity';
import { ContractTemplate } from './entities/contract-template.entity';
import { ContractVersion } from './contract-version.entity';
import { Tag } from './entities/tag.entity';
import { DocumentVersion } from '../versions/document-version.entity';
import { ReportGeneratorService } from './reports/report-generator.service';

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
      ContractAmendment,
      ContractPayment,
      ContractSignatureRequest,
      ContractNegotiation,
      ContractTemplate,
      ContractClause,
      ContractCustomField,
      ContractCustomValue,
      ContractImportLog,
      Tag,
      DocumentRecord,
      DocumentVersion,
    ]),
  ],
  controllers: [ClmController],
  providers: [ClmService, ReportGeneratorService],
  exports: [ClmService],
})
export class ClmModule {}
