export declare const NOTIFICATION_TYPES: readonly ["document_expiring_soon", "document_expired", "approval_assigned", "approval_stopped", "rfi_assigned", "rfi_overdue", "contract_expiring_soon", "contract_expired", "contract_obligation_pending", "document_new_version", "document_approval_result"];
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export declare const NOTIFICATION_DEFAULTS: Record<NotificationType, {
    inApp: boolean;
    email: boolean;
    label: string;
}>;
