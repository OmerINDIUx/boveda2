import { RequirePermission } from '../../../components/auth/require-permission';
import { RfiDetailPage } from '../../../components/modules/rfis-workspace';
import { PermissionKey } from '../../../lib/permissions';

export default function RfiDetailRoute() {
  return (
    <RequirePermission permission={PermissionKey.RfisManage}>
      <RfiDetailPage />
    </RequirePermission>
  );
}
