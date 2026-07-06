import { RequirePermission } from '../../../components/auth/require-permission';
import { ProjectDisciplinesListPage } from '../../../components/modules/project-admin-pages';
import { PermissionKey } from '../../../lib/permissions';

export default function AdminProjectDisciplinesPage() {
  return (
    <RequirePermission permission={PermissionKey.ProjectsManage}>
      <ProjectDisciplinesListPage />
    </RequirePermission>
  );
}
