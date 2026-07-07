import { RequirePermission } from '../../../../components/auth/require-permission';
import { DocumentAuditPage } from '../../../../components/modules/documents-pages';
import { PermissionKey } from '../../../../lib/permissions';

export default function DocumentAuditRoute() {
  return (
    <RequirePermission permission={PermissionKey.DocumentsView}>
      <DocumentAuditPage />
    </RequirePermission>
  );
}
