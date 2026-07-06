import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { DocumentRecord } from '../documents/document.entity';
import { ApprovalRequest } from '../approvals/approval-request.entity';
import { ApprovalStep } from '../approvals/approval-step.entity';
import { Contract } from '../clm/contract.entity';
import { ContractObligation } from '../clm/contract-obligation.entity';
import { Rfi } from '../rfis/rfi.entity';
import { NotificationDelivery } from './notification-delivery.entity';
import { NotificationPreference } from './notification-preference.entity';
import { Notification } from './notification.entity';
import { NotificationType } from './notifications.constants';
import { SmtpMailService } from './smtp-mail.service';
type NotificationRecipient = {
  userId: string;
  email?: string;
  name?: string;
};
type NotificationMeta = {
  route?: string;
  [key: string]: unknown;
};
type NotifyPayload = {
  recipients: NotificationRecipient[];
  notificationType: NotificationType;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
  category?: string;
  meta?: NotificationMeta;
  dedupeKey?: string;
};
export declare class NotificationsService {
  private readonly notifications;
  private readonly preferences;
  private readonly deliveries;
  private readonly users;
  private readonly documents;
  private readonly approvalRequests;
  private readonly approvalSteps;
  private readonly contracts;
  private readonly obligations;
  private readonly rfis;
  private readonly mailer;
  private readonly config;
  private readonly logger;
  constructor(
    notifications: Repository<Notification>,
    preferences: Repository<NotificationPreference>,
    deliveries: Repository<NotificationDelivery>,
    users: Repository<User>,
    documents: Repository<DocumentRecord>,
    approvalRequests: Repository<ApprovalRequest>,
    approvalSteps: Repository<ApprovalStep>,
    contracts: Repository<Contract>,
    obligations: Repository<ContractObligation>,
    rfis: Repository<Rfi>,
    mailer: SmtpMailService,
    config: ConfigService
  );
  listForUser(userId: string): Promise<
    {
      id: string;
      title: string;
      body: string;
      type: string;
      notificationType: string;
      entityType: string | undefined;
      entityId: string | undefined;
      readAt: Date | undefined;
      createdAt: Date;
      meta: any;
    }[]
  >;
  unreadCount(userId: string): Promise<number>;
  markAsRead(
    userId: string,
    id: string
  ): Promise<{
    ok: boolean;
  }>;
  markAllAsRead(userId: string): Promise<{
    ok: boolean;
    updated: number;
  }>;
  listPreferences(userId: string): Promise<
    {
      notificationType:
        | 'document_expiring_soon'
        | 'document_expired'
        | 'approval_assigned'
        | 'approval_stopped'
        | 'rfi_assigned'
        | 'rfi_overdue'
        | 'contract_expiring_soon'
        | 'contract_expired'
        | 'contract_obligation_pending'
        | 'document_new_version'
        | 'document_approval_result';
      label: string;
      inAppEnabled: boolean;
      emailEnabled: boolean;
    }[]
  >;
  updatePreferences(
    userId: string,
    items: Array<{
      notificationType: string;
      inAppEnabled: boolean;
      emailEnabled: boolean;
    }>
  ): Promise<
    {
      notificationType:
        | 'document_expiring_soon'
        | 'document_expired'
        | 'approval_assigned'
        | 'approval_stopped'
        | 'rfi_assigned'
        | 'rfi_overdue'
        | 'contract_expiring_soon'
        | 'contract_expired'
        | 'contract_obligation_pending'
        | 'document_new_version'
        | 'document_approval_result';
      label: string;
      inAppEnabled: boolean;
      emailEnabled: boolean;
    }[]
  >;
  create(
    userId: string,
    title: string,
    body: string,
    meta?: {
      type?: string;
      entityType?: string;
      entityId?: string;
      notificationType?: NotificationType;
      route?: string;
    }
  ): Promise<void>;
  notify(payload: NotifyPayload): Promise<{
    delivered: number;
    skipped: number;
  }>;
  runDailyChecks(): Promise<{
    ok: boolean;
    documents: {
      expiring: number;
      expired: number;
    };
    contracts: {
      expiring: number;
      expired: number;
    };
    approvals: {
      stopped: number;
    };
    rfis: {
      overdue: number;
    };
    obligations: {
      pending: number;
    };
  }>;
  private processDocumentDueDates;
  private processContractDueDates;
  private processStoppedFlows;
  private processOverdueRfis;
  private processPendingObligations;
  resolveApprovalRecipients(step: ApprovalStep | null | undefined): Promise<
    {
      userId: string;
      email: string;
      name: string;
    }[]
  >;
  private registerDelivery;
  private updateDeliveryStatus;
  private serialize;
  private buildEmailHtml;
  private toRecipients;
  private today;
  private addDays;
  private daysAgo;
}
export {};
