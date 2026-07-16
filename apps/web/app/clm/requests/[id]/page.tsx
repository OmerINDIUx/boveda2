import { RequirePermission } from '../../../../components/auth/require-permission';
import { ContractRequestDetailPage } from '../../../../components/modules/clm';
import { PermissionKey } from '../../../../lib/permissions';

export default function ClmRequestDetailRoute() {
  return (
    <RequirePermission permission={PermissionKey.ContractsManage}>
      <ContractRequestDetailPage />
    </RequirePermission>
  );
}
