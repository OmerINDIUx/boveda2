import { RequirePermission } from '../../../../components/auth/require-permission';
import { ContractFormPage } from '../../../../components/modules/clm';
import { PermissionKey } from '../../../../lib/permissions';

export default function Page() {
  return (
    <RequirePermission permission={PermissionKey.ContractsManage}>
      <ContractFormPage mode="edit" />
    </RequirePermission>
  );
}
