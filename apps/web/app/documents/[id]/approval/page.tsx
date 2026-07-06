import { RequirePermission } from '../../../../components/auth/require-permission';
import { DocumentApprovalPage } from '../../../../components/modules/documents-pages';
import { PermissionKey } from '../../../../lib/permissions';

export default function DocumentApprovalRoute() {
  return (
    <RequirePermission permission={PermissionKey.DocumentsApprove}>
      <DocumentApprovalPage />
    </RequirePermission>
  );
}
