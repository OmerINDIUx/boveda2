export declare class NotificationDelivery {
  id: string;
  userId: string;
  notificationType: string;
  channel: 'in_app' | 'email';
  status: 'sent' | 'failed' | 'skipped';
  subject?: string;
  entityType?: string;
  entityId?: string;
  dedupeKey?: string;
  errorMessage?: string;
  createdAt: Date;
}
