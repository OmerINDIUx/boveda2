import { RequirePermission } from '../../../components/auth/require-permission';
import { ClmReportsPage } from '../../../components/modules/clm';
import { PermissionKey } from '../../../lib/permissions';

export default function Page() {
  return (
    <RequirePermission permission={PermissionKey.ClmReports}>
      <ClmReportsPage />
    </RequirePermission>
  );
}
