import { RequirePermission } from '../../../components/auth/require-permission';
import { RfiCreatePage } from '../../../components/modules/rfis-workspace';
import { PermissionKey } from '../../../lib/permissions';

export default function RfiCreateRoute() {
  return (
    <RequirePermission permission={PermissionKey.RfisManage}>
      <RfiCreatePage />
    </RequirePermission>
  );
}
