import { RequirePermission } from '../../../../../components/auth/require-permission';
import { PermissionKey } from '../../../../../lib/permissions';
import SignatureCreatePage from '../create-page';

export default function NewSignaturePage() {
  return (
    <RequirePermission permission={PermissionKey.ClmSign}>
      <SignatureCreatePage />
    </RequirePermission>
  );
}
