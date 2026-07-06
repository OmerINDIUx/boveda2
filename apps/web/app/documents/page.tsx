import { RequirePermission } from '../../components/auth/require-permission';
import { DocumentsListPage } from '../../components/modules/documents-pages';
import { PermissionKey } from '../../lib/permissions';

export default function DocumentsPage() {
  return (
    <RequirePermission permission={PermissionKey.DocumentsView}>
      <DocumentsListPage />
    </RequirePermission>
  );
}
