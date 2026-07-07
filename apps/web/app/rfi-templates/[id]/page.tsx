import { RequirePermission } from '../../../components/auth/require-permission';
import { RfiTemplateFormPage } from '../../../components/modules/rfi-templates-pages';
import { PermissionKey } from '../../../lib/permissions';

export default function RfiTemplateEditRoute() {
  return (
    <RequirePermission permission={PermissionKey.RfisManage}>
      <RfiTemplateFormPage />
    </RequirePermission>
  );
}
