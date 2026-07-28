import { RequirePermission } from '../../../components/auth/require-permission';
import { UploadsWorkspace } from '../../../components/modules/uploads-workspace';
import { PermissionKey } from '../../../lib/permissions';

export default function NewDocumentPage() {
  return (
    <RequirePermission permission={PermissionKey.DocumentsCreate}>
      <UploadsWorkspace />
    </RequirePermission>
  );
}
