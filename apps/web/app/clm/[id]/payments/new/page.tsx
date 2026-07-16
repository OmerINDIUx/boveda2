import { RequirePermission } from '../../../../../components/auth/require-permission';
import { PermissionKey } from '../../../../../lib/permissions';
import PaymentCreatePage from '../create-page';

export default function NewPaymentPage() {
  return (
    <RequirePermission permission={PermissionKey.ClmFinance}>
      <PaymentCreatePage />
    </RequirePermission>
  );
}
