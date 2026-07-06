import { RequirePermission } from '../../../../../components/auth/require-permission';
import { RfiCommentCreatePage } from '../../../../../components/modules/rfis-workspace';
import { PermissionKey } from '../../../../../lib/permissions';

export default function RfiCommentCreateRoute() {
  return (
    <RequirePermission permission={PermissionKey.RfisManage}>
      <RfiCommentCreatePage />
    </RequirePermission>
  );
}
