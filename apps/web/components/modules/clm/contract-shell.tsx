'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import {
  Activity,
  FileSignature,
  FileText,
  FolderKanban,
  History,
  LayoutDashboard,
  MessageSquare,
} from 'lucide-react';
import type { ReactNode } from 'react';

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  match?: string[];
};

const sectionNav: NavItem[] = [
  {
    href: '',
    label: 'Resumen',
    icon: <LayoutDashboard size={16} />,
    match: [''],
  },
  {
    href: '/workspace',
    label: 'Workspace',
    icon: <FolderKanban size={16} />,
    match: ['/workspace'],
  },
  {
    href: '/versions',
    label: 'Contratos',
    icon: <FileText size={16} />,
    match: [
      '/versions',
      '/original',
      '/attachments',
      '/amendments',
      '/records/change_orders',
      '/negotiations',
      '/records/penalties',
      '/records/guarantees',
      '/records/retentions',
      '/records/releases',
      '/obligations',
      '/deliverables',
      '/payments',
    ],
  },
  {
    href: '/records/escalations',
    label: 'Escalamientos',
    icon: <History size={16} />,
    match: ['/records/escalations', '/records/claims', '/records/risks'],
  },
  {
    href: '/signatures',
    label: 'Firmas',
    icon: <FileSignature size={16} />,
    match: ['/signatures'],
  },
  {
    href: '/milestones',
    label: 'Hitos',
    icon: <Activity size={16} />,
    match: ['/milestones'],
  },
  {
    href: '/comments',
    label: 'Comentarios',
    icon: <MessageSquare size={16} />,
    match: ['/comments'],
  },
  {
    href: '/audit',
    label: 'Auditoria',
    icon: <History size={16} />,
    match: ['/audit'],
  },
];

export function ContractShell({ children }: { children: ReactNode }) {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const contractId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  if (!contractId) {
    return <>{children}</>;
  }

  const basePath = `/clm/${contractId}`;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <article className="card" style={{ padding: 14 }}>
        <div
          className="projects-actions"
          style={{ justifyContent: 'space-between', gap: 12, marginBottom: 10 }}
        >
          <div style={{ display: 'grid', gap: 2 }}>
            <small className="muted">Expediente contractual</small>
            <strong>Mapa del contrato</strong>
          </div>
          <div className="projects-actions" style={{ gap: 8 }}>
            <Link className="button secondary" href="/clm">
              Volver al centro CLM
            </Link>
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 10,
          }}
        >
          {sectionNav.map((item) => {
            const href = `${basePath}${item.href}`;
            const active = (item.match ?? [item.href]).some((suffix) =>
              suffix ? pathname.startsWith(`${basePath}${suffix}`) : pathname === basePath
            );
            return (
              <Link
                key={href}
                className="button secondary"
                href={href}
                aria-current={active ? 'page' : undefined}
                style={{
                  justifyContent: 'flex-start',
                  borderColor: active ? 'var(--accent)' : undefined,
                  background: active ? 'var(--color-accent-light)' : undefined,
                  color: active ? 'var(--color-accent-hover)' : undefined,
                }}
              >
                {item.icon} {item.label}
              </Link>
            );
          })}
        </div>
      </article>
      {children}
    </div>
  );
}
