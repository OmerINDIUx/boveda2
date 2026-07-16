import { RequirePermission } from '../../../components/auth/require-permission';
import { ContractDetailPage } from '../../../components/modules/clm';
import { PermissionKey } from '../../../lib/permissions';

export default function ContractDetailRoute() {
  return (
    <RequirePermission permission={PermissionKey.ContractsManage}>
      <ContractDetailPage />
    </RequirePermission>
  );
}
