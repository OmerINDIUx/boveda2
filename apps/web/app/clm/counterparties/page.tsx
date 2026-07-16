import { RequirePermission } from '../../../components/auth/require-permission';
import { CounterpartiesPage } from '../../../components/modules/clm';
import { PermissionKey } from '../../../lib/permissions';

export default function ClmCounterpartiesRoute() {
  return (
    <RequirePermission permission={PermissionKey.ContractsManage}>
      <CounterpartiesPage />
    </RequirePermission>
  );
}
