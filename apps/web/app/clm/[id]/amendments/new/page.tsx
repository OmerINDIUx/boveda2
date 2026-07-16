import { RequirePermission } from '../../../../../components/auth/require-permission';
import { PermissionKey } from '../../../../../lib/permissions';
import AmendmentCreatePage from '../create-page';

export default function NewAmendmentPage() {
  return (
    <RequirePermission permission={PermissionKey.ContractsManage}>
      <AmendmentCreatePage />
    </RequirePermission>
  );
}
