import { RequirePermission } from '../../../../components/auth/require-permission';
import { ProjectCatalogFormPage } from '../../../../components/modules/project-admin-pages';
import { PermissionKey } from '../../../../lib/permissions';

export default function NewProjectCatalogPage() {
  return (
    <RequirePermission permission={PermissionKey.ProjectsManage}>
      <ProjectCatalogFormPage mode="create" />
    </RequirePermission>
  );
}
