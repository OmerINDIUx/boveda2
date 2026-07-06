import { RequirePermission } from '../../../components/auth/require-permission';
import { DocumentCreatePage } from '../../../components/modules/documents-pages';
import { PermissionKey } from '../../../lib/permissions';

export default function NewDocumentPage() {
  return (
    <RequirePermission permission={PermissionKey.DocumentsCreate}>
      <DocumentCreatePage />
    </RequirePermission>
  );
}
