import { RequirePermission } from '../../../components/auth/require-permission';
import { ClmTemplatesListPage } from '../../../components/modules/clm-pages';
import { PermissionKey } from '../../../lib/permissions';

export default function Page() {
  return (
    <RequirePermission permission={PermissionKey.ClmTemplates}>
      <ClmTemplatesListPage />
    </RequirePermission>
  );
}
