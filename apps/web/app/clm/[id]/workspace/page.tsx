import { RequirePermission } from '../../../../components/auth/require-permission';
import { ContractCollaborationWorkspacePage } from '../../../../components/modules/clm/collaboration-workspace';
import { PermissionKey } from '../../../../lib/permissions';

export default function ContractWorkspaceRoute() {
  return (
    <RequirePermission permission={PermissionKey.ContractsManage}>
      <ContractCollaborationWorkspacePage />
    </RequirePermission>
  );
}
