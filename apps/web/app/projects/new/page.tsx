import { RequirePermission } from '../../../components/auth/require-permission';
import { ProjectFormPage } from '../../../components/modules/projects-pages';
import { PermissionKey } from '../../../lib/permissions';

export default function NewProjectPage() {
  return (
    <RequirePermission permission={PermissionKey.ProjectsManage}>
      <ProjectFormPage mode="create" />
    </RequirePermission>
  );
}
