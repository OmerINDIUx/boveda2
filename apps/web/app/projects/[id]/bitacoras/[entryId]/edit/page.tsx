import { RequirePermission } from '../../../../../../components/auth/require-permission';
import { BitacoraFormPage } from '../../../../../../components/modules/bitacoras-pages';
import { PermissionKey } from '../../../../../../lib/permissions';

export default function EditBitacoraRoute() {
  return (
    <RequirePermission permission={PermissionKey.BitacorasEdit}>
      <BitacoraFormPage />
    </RequirePermission>
  );
}
