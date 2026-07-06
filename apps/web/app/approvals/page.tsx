import { RequirePermission } from '../../components/auth/require-permission';
import { ApprovalsInboxPage } from '../../components/modules/approvals-pages';
import { PermissionKey } from '../../lib/permissions';

export default function ApprovalsPage() {
  return (
    <RequirePermission permission={PermissionKey.DocumentsApprove}>
      <ApprovalsInboxPage />
    </RequirePermission>
  );
}
