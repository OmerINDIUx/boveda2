import { RequirePermission } from '../../../components/auth/require-permission';
import { RfiJustGoPage } from '../../../components/modules/rfi-justgo-page';
import { PermissionKey } from '../../../lib/permissions';

export default function RfiJustGoRoute() {
  return (
    <RequirePermission permission={PermissionKey.RfisManage}>
      <RfiJustGoPage />
    </RequirePermission>
  );
}
