import { RequirePermission } from '../../../../components/auth/require-permission';
import { ApprovalRequestCreatePage } from '../../../../components/modules/approvals-pages';
import { PermissionKey } from '../../../../lib/permissions';

export default function NewApprovalRequestPage() {
  return (
    <RequirePermission permission={PermissionKey.DocumentsApprove}>
      <ApprovalRequestCreatePage />
    </RequirePermission>
  );
}
