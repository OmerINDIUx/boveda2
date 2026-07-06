import { RequirePermission } from '../../../../components/auth/require-permission';
import { DocumentReviewPage } from '../../../../components/modules/documents-pages';
import { PermissionKey } from '../../../../lib/permissions';

export default function DocumentReviewRoute() {
  return (
    <RequirePermission permission={PermissionKey.DocumentsView}>
      <DocumentReviewPage />
    </RequirePermission>
  );
}
