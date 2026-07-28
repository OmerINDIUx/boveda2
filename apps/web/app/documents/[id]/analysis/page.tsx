import { RequirePermission } from '../../../../components/auth/require-permission';
import { DocumentAnalysisPage } from '../../../../components/modules/document-analysis-page';
import { PermissionKey } from '../../../../lib/permissions';

export default function DocumentAnalysisRoute() {
  return (
    <RequirePermission permission={PermissionKey.DocumentsView}>
      <DocumentAnalysisPage />
    </RequirePermission>
  );
}
