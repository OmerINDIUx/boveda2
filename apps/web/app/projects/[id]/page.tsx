import { RequirePermission } from '../../../components/auth/require-permission';
import { ProjectDetailPage } from '../../../components/modules/projects-pages';
import { PermissionKey } from '../../../lib/permissions';

export default function ProjectDetailRoute() {
  return (
    <RequirePermission permission={PermissionKey.ProjectsView}>
      <ProjectDetailPage />
    </RequirePermission>
  );
}
