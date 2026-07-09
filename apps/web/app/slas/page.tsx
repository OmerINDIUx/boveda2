import { RequirePermission } from '../../components/auth/require-permission';
import { PermissionKey } from '../../lib/permissions';
import { SlasWorkspace } from '../../components/modules/slas-workspace';

export default function SlasPage() {
  return (
    <RequirePermission permission={PermissionKey.SlaManage}>
      <SlasWorkspace />
    </RequirePermission>
  );
}
