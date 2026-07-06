import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProjectsModule } from '../projects/projects.module';
import { DocumentAuditLog } from '../documents/document-audit-log.entity';
import { DocumentRecord } from '../documents/document.entity';
import { ApprovalFlow } from './approval-flow.entity';
import { ApprovalRequestAction } from './approval-request-action.entity';
import { ApprovalRequest } from './approval-request.entity';
import { ApprovalStep } from './approval-step.entity';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';

@Module({
  imports: [
    ProjectsModule,
    NotificationsModule,
    TypeOrmModule.forFeature([
      ApprovalFlow,
      ApprovalStep,
      ApprovalRequest,
      ApprovalRequestAction,
      DocumentRecord,
      DocumentAuditLog,
    ]),
  ],
  controllers: [ApprovalsController],
  providers: [ApprovalsService],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}
