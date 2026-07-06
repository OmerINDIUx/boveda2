import { RequirePermission } from '../../components/auth/require-permission';
import { RfisWorkspace } from '../../components/modules/rfis-workspace';
import { PermissionKey } from '../../lib/permissions';

export default function RfisPage() {
  return (
    <RequirePermission permission={PermissionKey.RfisManage}>
      <RfisWorkspace />
    </RequirePermission>
  );
}
