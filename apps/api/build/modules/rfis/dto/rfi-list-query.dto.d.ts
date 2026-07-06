export declare class RfiListQueryDto {
    projectId?: string;
    status?: 'open' | 'in_progress' | 'answered' | 'closed' | 'overdue';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    assignedToId?: string;
    search?: string;
}
