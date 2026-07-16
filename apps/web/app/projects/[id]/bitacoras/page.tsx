import { RequirePermission } from '../../../../components/auth/require-permission';
import { BitacorasListPage } from '../../../../components/modules/bitacoras-pages';
import { PermissionKey } from '../../../../lib/permissions';

export default function BitacorasRoute() {
  return (
    <RequirePermission permission={PermissionKey.BitacorasView}>
      <BitacorasListPage />
    </RequirePermission>
  );
}
