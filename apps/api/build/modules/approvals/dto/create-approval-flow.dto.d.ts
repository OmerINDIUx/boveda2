export declare class CreateApprovalFlowDto {
    projectId: string;
    name: string;
    entityType: 'document' | 'contract' | 'rfi';
    scopeType?: 'global' | 'document_specific';
    targetDocumentId?: string;
    requireForPublication?: boolean;
    steps: Array<{
        stepOrder: number;
        name: string;
        approverUserId?: string;
        approverRoleId?: string;
        required?: boolean;
    }>;
}
