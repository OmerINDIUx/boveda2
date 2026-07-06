import { RequirePermission } from '../../../components/auth/require-permission';
import { ContractFormPage } from '../../../components/modules/clm-pages';
import { PermissionKey } from '../../../lib/permissions';

export default function NewContractPage() {
  return (
    <RequirePermission permission={PermissionKey.ContractsManage}>
      <ContractFormPage mode="create" />
    </RequirePermission>
  );
}
