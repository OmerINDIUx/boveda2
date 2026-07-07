'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import styles from '../../styles/layout.module.css';

const routeLabels: Record<string, string> = {
  dashboard: 'Panel',
  projects: 'Proyectos',
  documents: 'Documentos',
  rfis: 'Consultas',
  approvals: 'Aprobaciones',
  flows: 'Flujos',
  notifications: 'Notificaciones',
  'ai-query': 'Consulta IA',
  clm: 'Contratos',
  admin: 'Administración',
  users: 'Usuarios',
  roles: 'Roles',
  'project-catalogs': 'Catálogos',
  'project-disciplines': 'Disciplinas',
  'project-users': 'Usuarios proyecto',
  new: 'Nuevo',
  edit: 'Editar',
  view: 'Ver',
  version: 'Versiones',
  review: 'Revisión',
  approval: 'Aprobación',
  comments: 'Comentarios',
  respond: 'Responder',
  attachments: 'Adjuntos',
  milestones: 'Hitos',
  obligations: 'Obligaciones',
};

export function Breadcrumbs() {
  const pathname = usePathname();

  if (pathname === '/login') return null;

  const segments = pathname.split('/').filter(Boolean);

  const crumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const label = routeLabels[segment] || segment;
    const isLast = index === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
      <Link href="/dashboard" className={styles.breadcrumbLink}>
        <Home size={16} />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href} className={styles.breadcrumbItem}>
          <ChevronRight size={14} />
          {crumb.isLast ? (
            <span className={styles.breadcrumbActive}>{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className={styles.breadcrumbLink}>
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
