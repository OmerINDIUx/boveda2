import { RequirePermission } from '../../../../../components/auth/require-permission';
import { ProjectDisciplineFormPage } from '../../../../../components/modules/project-admin-pages';
import { PermissionKey } from '../../../../../lib/permissions';

export default function EditProjectDisciplinePage() {
  return (
    <RequirePermission permission={PermissionKey.ProjectsManage}>
      <ProjectDisciplineFormPage mode="edit" />
    </RequirePermission>
  );
}
