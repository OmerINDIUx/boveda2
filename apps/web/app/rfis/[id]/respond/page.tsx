import { RequirePermission } from '../../../../components/auth/require-permission';
import { RfiRespondPage } from '../../../../components/modules/rfis-workspace';
import { PermissionKey } from '../../../../lib/permissions';

export default function RfiRespondRoute() {
  return (
    <RequirePermission permission={PermissionKey.RfisManage}>
      <RfiRespondPage />
    </RequirePermission>
  );
}
