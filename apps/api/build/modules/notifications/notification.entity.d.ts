export declare class Notification {
    id: string;
    userId: string;
    title: string;
    body: string;
    type: string;
    notificationType: string;
    entityType?: string;
    entityId?: string;
    metaJson?: string;
    readAt?: Date;
    createdAt: Date;
    deletedAt?: Date;
}
