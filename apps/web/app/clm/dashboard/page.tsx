import { RequirePermission } from '../../../components/auth/require-permission';
import { ClmDashboardPage } from '../../../components/modules/clm';
import { PermissionKey } from '../../../lib/permissions';

export default function Page() {
  return (
    <RequirePermission permission={PermissionKey.ContractsManage}>
      <ClmDashboardPage />
    </RequirePermission>
  );
}
