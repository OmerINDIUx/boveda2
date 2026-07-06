import { RequirePermission } from '../../../components/auth/require-permission';
import { ProjectCatalogsListPage } from '../../../components/modules/project-admin-pages';
import { PermissionKey } from '../../../lib/permissions';

export default function AdminProjectCatalogsPage() {
  return (
    <RequirePermission permission={PermissionKey.ProjectsManage}>
      <ProjectCatalogsListPage />
    </RequirePermission>
  );
}
