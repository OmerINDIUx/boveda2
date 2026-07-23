import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../../storage/storage.module';
import { DocumentRecord } from '../documents/document.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';
import { AiQueryModule } from '../ai-query/ai-query.module';
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
import { ContractLifecycleEvent } from './entities/contract-lifecycle-event.entity';
import { Contract } from './contract.entity';
import { ContractMilestone } from './contract-milestone.entity';
import { ContractNegotiation } from './entities/contract-negotiation.entity';
import { ContractObligation } from './contract-obligation.entity';
import { ContractPayment } from './entities/contract-payment.entity';
import { ContractSignatureRequest } from './entities/contract-signature-request.entity';
import { ContractTemplate } from './entities/contract-template.entity';
import { ContractVersion } from './contract-version.entity';
import { Tag } from './entities/tag.entity';
import { ContractRequest } from './entities/contract-request.entity';
import { Counterparty } from './entities/counterparty.entity';
import { CounterpartyContact } from './entities/counterparty-contact.entity';
import { CounterpartyDocument } from './entities/counterparty-document.entity';
import { ContractTextIndex } from './entities/contract-text-index.entity';
import { DocumentVersion } from '../versions/document-version.entity';
import { ReportGeneratorService } from './reports/report-generator.service';
import { StubSignatureProvider } from './signature/stub-signature.provider';
import { DocuSignSignatureProvider } from './signature/docusign-signature.provider';
import { DisabledSignatureProvider } from './signature/disabled-signature.provider';
import { DisabledErpProvider } from './integration/disabled-erp.provider';
import { HttpErpProvider } from './integration/http-erp.provider';
import { StubErpProvider } from './integration/stub-erp.provider';
import { ContractExtractionRun } from './entities/contract-extraction-run.entity';
import { ContractExtractionService } from './contract-extraction.service';
import { ContractRecord } from './entities/contract-record.entity';
import { ContractRecordAction } from './entities/contract-record-action.entity';
import { ContractRecordsController } from './contract-records.controller';
import { ContractRecordsService } from './contract-records.service';
import { ContractDeliverable } from './entities/contract-deliverable.entity';

@Module({
  imports: [
    ProjectsModule,
    StorageModule,
    NotificationsModule,
    UsersModule,
    AiQueryModule,
    TypeOrmModule.forFeature([
      Contract,
      ContractVersion,
      ContractAttachment,
      ContractObligation,
      ContractMilestone,
      ContractDeliverable,
      ContractComment,
      ContractAuditLog,
      ContractLifecycleEvent,
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
      ContractRequest,
      ContractTextIndex,
      Counterparty,
      CounterpartyContact,
      CounterpartyDocument,
      DocumentRecord,
      DocumentVersion,
      ContractExtractionRun,
      ContractRecord,
      ContractRecordAction,
    ]),
  ],
  controllers: [ClmController, ContractRecordsController],
  providers: [
    ClmService,
    ContractRecordsService,
    ContractExtractionService,
    ReportGeneratorService,
    {
      provide: 'SIGNATURE_PROVIDER',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const defaultProvider =
          config.get<string>('NODE_ENV') === 'production' ? 'disabled' : 'stub';
        const provider = config.get<string>('SIGNATURE_PROVIDER') ?? defaultProvider;
        if (provider === 'docusign') {
          return new DocuSignSignatureProvider(config);
        }
        if (provider === 'stub') return new StubSignatureProvider();
        return new DisabledSignatureProvider();
      },
    },
    {
      provide: 'ERP_INTEGRATION',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const defaultProvider =
          config.get<string>('NODE_ENV') === 'production' ? 'disabled' : 'stub';
        const provider = config.get<string>('ERP_PROVIDER') ?? defaultProvider;
        if (provider === 'http') return new HttpErpProvider(config);
        if (provider === 'stub') return new StubErpProvider();
        return new DisabledErpProvider();
      },
    },
  ],
  exports: [ClmService],
})
export class ClmModule {}
