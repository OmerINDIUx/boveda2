import { RequirePermission } from '../../../../components/auth/require-permission';
import { AttachmentsWorkspace } from '../../../../components/modules/clm/attachments-manage';
import { PermissionKey } from '../../../../lib/permissions';

export default function Page() {
  return (
    <RequirePermission permission={PermissionKey.ContractsManage}>
      <AttachmentsWorkspace />
    </RequirePermission>
  );
}
