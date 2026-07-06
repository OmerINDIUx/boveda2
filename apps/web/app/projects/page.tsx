import { RequirePermission } from '../../components/auth/require-permission';
import { ProjectsListPage } from '../../components/modules/projects-pages';
import { PermissionKey } from '../../lib/permissions';

export default function ProjectsPage() {
  return (
    <RequirePermission permission={PermissionKey.ProjectsView}>
      <ProjectsListPage />
    </RequirePermission>
  );
}
