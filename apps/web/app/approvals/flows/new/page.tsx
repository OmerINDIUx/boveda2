import { RequirePermission } from '../../../../components/auth/require-permission';
import { ApprovalFlowFormPage } from '../../../../components/modules/approval-flow-form';
import { PermissionKey } from '../../../../lib/permissions';

export default function NewApprovalFlowPage() {
  return (
    <RequirePermission permission={PermissionKey.ApprovalsManage}>
      <ApprovalFlowFormPage mode="create" />
    </RequirePermission>
  );
}
