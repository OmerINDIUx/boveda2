import { RequirePermission } from '../../../components/auth/require-permission';
import { DocumentDetailPage } from '../../../components/modules/documents-pages';
import { PermissionKey } from '../../../lib/permissions';

export default function DocumentDetailRoute() {
  return (
    <RequirePermission permission={PermissionKey.DocumentsView}>
      <DocumentDetailPage />
    </RequirePermission>
  );
}
