export declare const PermissionKey: {
    readonly UsersRead: "users.read";
    readonly UsersManage: "users.manage";
    readonly RolesRead: "roles.read";
    readonly RolesManage: "roles.manage";
    readonly ProjectsView: "projects.view";
    readonly ProjectsManage: "projects.manage";
    readonly DocumentsCreate: "documents.create";
    readonly DocumentsView: "documents.view";
    readonly DocumentsEdit: "documents.edit";
    readonly DocumentsDownload: "documents.download";
    readonly DocumentsPrint: "documents.print";
    readonly DocumentsApprove: "documents.approve";
    readonly DocumentsDelete: "documents.delete";
    readonly RfisManage: "rfis.manage";
    readonly ApprovalsManage: "approvals.manage";
    readonly AuditView: "audit.view";
    readonly ContractsManage: "contracts.manage";
    readonly AiQuery: "ai.query";
};
export type PermissionKey = (typeof PermissionKey)[keyof typeof PermissionKey];
export declare const PermissionCatalog: Array<{
    key: PermissionKey;
    label: string;
    module: string;
}>;
