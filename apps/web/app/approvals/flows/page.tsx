import { RequirePermission } from '../../../components/auth/require-permission';
import { ApprovalFlowsListPage } from '../../../components/modules/approvals-pages';
import { PermissionKey } from '../../../lib/permissions';

export default function ApprovalFlowsPage() {
  return (
    <RequirePermission permission={PermissionKey.ApprovalsManage}>
      <ApprovalFlowsListPage />
    </RequirePermission>
  );
}
