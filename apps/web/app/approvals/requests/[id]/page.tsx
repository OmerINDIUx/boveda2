import { RequirePermission } from '../../../../components/auth/require-permission';
import { ApprovalRequestDetailPage } from '../../../../components/modules/approvals-pages';
import { PermissionKey } from '../../../../lib/permissions';

export default function ApprovalRequestDetailRoute() {
  return (
    <RequirePermission permission={PermissionKey.DocumentsApprove}>
      <ApprovalRequestDetailPage />
    </RequirePermission>
  );
}
