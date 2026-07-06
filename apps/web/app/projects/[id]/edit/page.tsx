import { RequirePermission } from '../../../../components/auth/require-permission';
import { ProjectFormPage } from '../../../../components/modules/projects-pages';
import { PermissionKey } from '../../../../lib/permissions';

export default function EditProjectPage() {
  return (
    <RequirePermission permission={PermissionKey.ProjectsManage}>
      <ProjectFormPage mode="edit" />
    </RequirePermission>
  );
}
