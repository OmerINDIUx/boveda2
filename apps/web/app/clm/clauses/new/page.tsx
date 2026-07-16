import { RequirePermission } from '../../../../components/auth/require-permission';
import { ClmClauseCreatePage } from '../../../../components/modules/clm';
import { PermissionKey } from '../../../../lib/permissions';

export default function Page() {
  return (
    <RequirePermission permission={PermissionKey.ClmTemplates}>
      <ClmClauseCreatePage />
    </RequirePermission>
  );
}
