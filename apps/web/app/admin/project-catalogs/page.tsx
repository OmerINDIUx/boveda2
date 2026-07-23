import Link from 'next/link';
import { RequirePermission } from '../../../components/auth/require-permission';
import { SectionHeader } from '../../../components/modules/section-header';
import { PermissionKey } from '../../../lib/permissions';

const catalogs = [
  {
    key: 'workType',
    label: 'Tipo de obra',
    description: 'Edificación vertical, infraestructura hidráulica, industrial.',
  },
  {
    key: 'currentStage',
    label: 'Etapa actual',
    description: 'Planificación, coordinación IFC, construcción, cierre.',
  },
  { key: 'priority', label: 'Prioridad', description: 'Baja, media, alta, crítica.' },
] as const;

export default function AdminProjectCatalogsPage() {
  return (
    <RequirePermission permission={PermissionKey.ProjectsManage}>
      <SectionHeader
        title="Catálogos de centros de costos"
        description="Cada catálogo tiene su propia página con CRUD independiente."
      />
      <section className="grid">
        {catalogs.map((catalog) => (
          <Link
            className="card span-3"
            key={catalog.key}
            href={`/admin/project-catalogs/category/${catalog.key}`}
          >
            <h3>{catalog.label}</h3>
            <p className="muted">{catalog.description}</p>
          </Link>
        ))}
      </section>
    </RequirePermission>
  );
}
