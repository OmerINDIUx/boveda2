import { RequirePermission } from '../../../../../components/auth/require-permission';
import { ContractAttachmentCreatePage } from '../../../../../components/modules/clm';
import { PermissionKey } from '../../../../../lib/permissions';

export default function NewContractAttachmentPage() {
  return (
    <RequirePermission permission={PermissionKey.ContractsManage}>
      <ContractAttachmentCreatePage />
    </RequirePermission>
  );
}
