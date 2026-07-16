import { redirect } from 'next/navigation';
import { RequirePermission } from '../../../../../../../components/auth/require-permission';
import { ProjectCatalogFormPage } from '../../../../../../../components/modules/project-admin-pages';
import { PermissionKey } from '../../../../../../../lib/permissions';

const VALID_CATEGORIES = ['workType', 'currentStage', 'priority'];

export default async function EditProjectCatalogCategoryPage({
  params,
}: {
  params: Promise<{ category: string; id: string }>;
}) {
  const { category } = await params;

  if (!VALID_CATEGORIES.includes(category)) {
    redirect('/admin/project-catalogs');
  }

  return (
    <RequirePermission permission={PermissionKey.ProjectsManage}>
      <ProjectCatalogFormPage mode="edit" />
    </RequirePermission>
  );
}
