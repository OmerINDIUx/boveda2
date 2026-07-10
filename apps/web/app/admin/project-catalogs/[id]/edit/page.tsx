import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function OldEditProjectCatalogPage() {
  redirect('/admin/project-catalogs');
}
