declare class NotificationPreferenceItemDto {
    notificationType: string;
    inAppEnabled: boolean;
    emailEnabled: boolean;
}
export declare class UpdateNotificationPreferencesDto {
    items: NotificationPreferenceItemDto[];
}
export {};
