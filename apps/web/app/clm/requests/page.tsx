import { RequirePermission } from '../../../components/auth/require-permission';
import { ContractRequestsPage } from '../../../components/modules/clm';
import { PermissionKey } from '../../../lib/permissions';

export default function ClmRequestsRoute() {
  return (
    <RequirePermission permission={PermissionKey.ContractsManage}>
      <ContractRequestsPage />
    </RequirePermission>
  );
}
