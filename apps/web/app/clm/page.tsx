import { RequirePermission } from '../../components/auth/require-permission';
import { ClmWorkspacePage } from '../../components/modules/clm';
import { PermissionKey } from '../../lib/permissions';

export default function ClmPage() {
  return (
    <RequirePermission permission={PermissionKey.ContractsManage}>
      <ClmWorkspacePage />
    </RequirePermission>
  );
}
