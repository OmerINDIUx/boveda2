import { RequestUser } from '../../common/interfaces/request-user.interface';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { NotificationsScheduler } from './notifications.scheduler';
import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
  private readonly notifications;
  private readonly scheduler;
  constructor(notifications: NotificationsService, scheduler: NotificationsScheduler);
  list(user: RequestUser): Promise<
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
  unreadCount(user: RequestUser): Promise<number>;
  markAsRead(
    user: RequestUser,
    id: string
  ): Promise<{
    ok: boolean;
  }>;
  markAllAsRead(user: RequestUser): Promise<{
    ok: boolean;
    updated: number;
  }>;
  preferences(user: RequestUser): Promise<
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
    user: RequestUser,
    dto: UpdateNotificationPreferencesDto
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
  runJobs(): Promise<
    | {
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
      }
    | {
        ok: boolean;
        skipped: boolean;
      }
  >;
}
