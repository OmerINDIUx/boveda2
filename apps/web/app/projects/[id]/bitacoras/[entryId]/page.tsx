import { RequirePermission } from '../../../../../components/auth/require-permission';
import { BitacoraDetailPage } from '../../../../../components/modules/bitacoras-pages';
import { PermissionKey } from '../../../../../lib/permissions';

export default function BitacoraDetailRoute() {
  return (
    <RequirePermission permission={PermissionKey.BitacorasView}>
      <BitacoraDetailPage />
    </RequirePermission>
  );
}
