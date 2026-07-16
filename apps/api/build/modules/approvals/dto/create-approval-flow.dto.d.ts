export declare class CreateApprovalFlowDto {
    projectId: string;
    name: string;
    entityType: 'document' | 'contract' | 'rfi';
    scopeType?: 'global' | 'document_specific';
    targetDocumentId?: string;
    requireForPublication?: boolean;
    steps: Array<{
        id?: string;
        stepOrder: number;
        name: string;
        approverUserIds?: string[];
        approverRoleId?: string;
        required?: boolean;
        dueDays?: number;
    }>;
}
