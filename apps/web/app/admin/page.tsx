import Link from 'next/link';
import { SectionHeader } from '../../components/modules/section-header';

export default function AdminPage() {
  return (
    <>
      <SectionHeader
        title="Administración"
        description="Usuarios, roles, permisos globales y catálogos separados del alta de centros de costos."
      />
      <section className="grid">
        <Link className="card span-3" href="/admin/users">
          Usuarios
        </Link>
        <Link className="card span-3" href="/admin/roles">
          Roles
        </Link>
        <Link className="card span-3" href="/admin/permissions">
          Matriz de permisos
        </Link>
        <Link className="card span-3" href="/admin/project-users">
          Usuarios por centro de costos
        </Link>
        <Link className="card span-3" href="/admin/project-catalogs">
          Catálogos de centros de costos
        </Link>
        <Link className="card span-3" href="/admin/project-disciplines">
          Disciplinas
        </Link>
      </section>
    </>
  );
}
