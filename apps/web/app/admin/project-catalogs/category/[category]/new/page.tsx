import { redirect } from 'next/navigation';
import { RequirePermission } from '../../../../../../components/auth/require-permission';
import { ProjectCatalogFormPage } from '../../../../../../components/modules/project-admin-pages';
import { PermissionKey } from '../../../../../../lib/permissions';

const VALID_CATEGORIES = ['workType', 'currentStage', 'priority', 'status'];

export default async function NewProjectCatalogCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  if (!VALID_CATEGORIES.includes(category)) {
    redirect('/admin/project-catalogs');
  }

  return (
    <RequirePermission permission={PermissionKey.ProjectsManage}>
      <ProjectCatalogFormPage mode="create" defaultCategory={category} />
    </RequirePermission>
  );
}
