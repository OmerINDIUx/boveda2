export declare class AuditLog {
    id: string;
    actorId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}
