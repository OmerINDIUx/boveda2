import { RequirePermission } from '../../../../../components/auth/require-permission';
import { ContractVersionCreatePage } from '../../../../../components/modules/clm';
import { PermissionKey } from '../../../../../lib/permissions';

export default function NewContractVersionPage() {
  return (
    <RequirePermission permission={PermissionKey.ContractsManage}>
      <ContractVersionCreatePage />
    </RequirePermission>
  );
}
