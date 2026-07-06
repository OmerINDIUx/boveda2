import { RequirePermission } from '../../../../components/auth/require-permission';
import { DocumentVersionPage } from '../../../../components/modules/documents-pages';
import { PermissionKey } from '../../../../lib/permissions';

export default function DocumentVersionRoute() {
  return (
    <RequirePermission permission={PermissionKey.DocumentsCreate}>
      <DocumentVersionPage />
    </RequirePermission>
  );
}
