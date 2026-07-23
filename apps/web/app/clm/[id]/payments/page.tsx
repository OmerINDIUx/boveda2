import { RequirePermission } from '../../../../components/auth/require-permission';
import { PaymentsWorkspace } from '../../../../components/modules/clm/payments-workspace';
import { PermissionKey } from '../../../../lib/permissions';

export default function Page() {
  return (
    <RequirePermission permission={PermissionKey.ClmFinance}>
      <PaymentsWorkspace />
    </RequirePermission>
  );
}
