import { RequirePermission } from '../../../../components/auth/require-permission';
import { ContractRequestFormPage } from '../../../../components/modules/clm';
import { PermissionKey } from '../../../../lib/permissions';

export default function ClmRequestNewRoute() {
  return (
    <RequirePermission permission={PermissionKey.ContractsManage}>
      <ContractRequestFormPage />
    </RequirePermission>
  );
}
