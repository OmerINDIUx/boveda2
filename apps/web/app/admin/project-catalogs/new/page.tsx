import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function OldNewProjectCatalogPage() {
  redirect('/admin/project-catalogs');
}
