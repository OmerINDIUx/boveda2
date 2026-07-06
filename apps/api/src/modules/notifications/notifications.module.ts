import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalRequest } from '../approvals/approval-request.entity';
import { ApprovalStep } from '../approvals/approval-step.entity';
import { ContractObligation } from '../clm/contract-obligation.entity';
import { Contract } from '../clm/contract.entity';
import { DocumentRecord } from '../documents/document.entity';
import { Rfi } from '../rfis/rfi.entity';
import { User } from '../users/user.entity';
import { NotificationDelivery } from './notification-delivery.entity';
import { NotificationPreference } from './notification-preference.entity';
import { Notification } from './notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsScheduler } from './notifications.scheduler';
import { NotificationsService } from './notifications.service';
import { SmtpMailService } from './smtp-mail.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationPreference,
      NotificationDelivery,
      User,
      DocumentRecord,
      ApprovalRequest,
      ApprovalStep,
      Contract,
      ContractObligation,
      Rfi,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, SmtpMailService, NotificationsScheduler],
  exports: [NotificationsService],
})
export class NotificationsModule {}
