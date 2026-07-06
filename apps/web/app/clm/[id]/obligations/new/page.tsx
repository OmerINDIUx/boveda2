import { RequirePermission } from '../../../../../components/auth/require-permission';
import { ContractObligationCreatePage } from '../../../../../components/modules/clm-pages';
import { PermissionKey } from '../../../../../lib/permissions';

export default function NewContractObligationPage() {
  return (
    <RequirePermission permission={PermissionKey.ContractsManage}>
      <ContractObligationCreatePage />
    </RequirePermission>
  );
}
