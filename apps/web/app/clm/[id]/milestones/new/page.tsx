import { RequirePermission } from '../../../../../components/auth/require-permission';
import { ContractMilestoneCreatePage } from '../../../../../components/modules/clm';
import { PermissionKey } from '../../../../../lib/permissions';

export default function NewContractMilestonePage() {
  return (
    <RequirePermission permission={PermissionKey.ContractsManage}>
      <ContractMilestoneCreatePage />
    </RequirePermission>
  );
}
