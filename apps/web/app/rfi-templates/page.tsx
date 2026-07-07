import { RequirePermission } from '../../components/auth/require-permission';
import { RfiTemplatesListPage } from '../../components/modules/rfi-templates-pages';
import { PermissionKey } from '../../lib/permissions';

export default function RfiTemplatesRoute() {
  return (
    <RequirePermission permission={PermissionKey.RfisManage}>
      <RfiTemplatesListPage />
    </RequirePermission>
  );
}
