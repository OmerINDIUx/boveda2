import { RequirePermission } from '../../../../../../components/auth/require-permission';
import { ContractExtractionReviewPage } from '../../../../../../components/modules/clm';
import { PermissionKey } from '../../../../../../lib/permissions';

export default function AttachmentExtractionReviewRoute() {
  return (
    <RequirePermission permission={PermissionKey.ContractsManage}>
      <ContractExtractionReviewPage />
    </RequirePermission>
  );
}
