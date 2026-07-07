import { RequirePermission } from '../../../../components/auth/require-permission';
import { ContractVersionCreatePage } from '../../../../components/modules/clm-pages';
import { PermissionKey } from '../../../../lib/permissions';

export default function Page() {
  return (
    <RequirePermission permission={PermissionKey.ContractsManage}>
      <ContractVersionCreatePage />
    </RequirePermission>
  );
}
