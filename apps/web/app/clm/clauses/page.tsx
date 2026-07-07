import { RequirePermission } from '../../../components/auth/require-permission';
import { ClmClausesListPage } from '../../../components/modules/clm-pages';
import { PermissionKey } from '../../../lib/permissions';

export default function Page() {
  return (
    <RequirePermission permission={PermissionKey.ClmTemplates}>
      <ClmClausesListPage />
    </RequirePermission>
  );
}
