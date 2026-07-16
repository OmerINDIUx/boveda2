import { RequirePermission } from '../../../../../components/auth/require-permission';
import { PermissionKey } from '../../../../../lib/permissions';
import NegotiationCreatePage from '../create-page';

export default function NewNegotiationPage() {
  return (
    <RequirePermission permission={PermissionKey.ContractsManage}>
      <NegotiationCreatePage />
    </RequirePermission>
  );
}
