import { RequirePermission } from '../../../../../components/auth/require-permission';
import { ApprovalFlowFormPage } from '../../../../../components/modules/approvals-pages';
import { PermissionKey } from '../../../../../lib/permissions';

export default function EditApprovalFlowPage() {
  return (
    <RequirePermission permission={PermissionKey.ApprovalsManage}>
      <ApprovalFlowFormPage mode="edit" />
    </RequirePermission>
  );
}
