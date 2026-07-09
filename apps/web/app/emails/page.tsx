import { RequirePermission } from '../../components/auth/require-permission';
import { PermissionKey } from '../../lib/permissions';
import { EmailsWorkspace } from '../../components/modules/emails-workspace';

export default function EmailsPage() {
  return (
    <RequirePermission permission={PermissionKey.EmailsView}>
      <EmailsWorkspace />
    </RequirePermission>
  );
}
