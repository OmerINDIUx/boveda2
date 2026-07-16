import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
export declare class NotificationsScheduler implements OnModuleInit, OnModuleDestroy {
    private readonly notifications;
    private readonly logger;
    private timer?;
    constructor(notifications: NotificationsService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    runIfNeeded(force?: boolean): Promise<{
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
    } | {
        ok: boolean;
        skipped: boolean;
    }>;
    private shouldRunToday;
}
