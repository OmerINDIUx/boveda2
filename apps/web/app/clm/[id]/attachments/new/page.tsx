import { RequirePermission } from '../../../../../components/auth/require-permission';
import { AttachmentsWorkspace } from '../../../../../components/modules/clm/attachments-manage';
import { PermissionKey } from '../../../../../lib/permissions';

export default function NewContractAttachmentPage() {
  return (
    <RequirePermission permission={PermissionKey.ContractsManage}>
      <AttachmentsWorkspace initialUploadOpen />
    </RequirePermission>
  );
}
