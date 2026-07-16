'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import {
  Activity,
  CheckSquare,
  FileSignature,
  FileText,
  FolderKanban,
  History,
  LayoutDashboard,
  MessageSquare,
  Scale,
  Upload,
  Wallet,
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
    label: 'Versiones',
    icon: <FileText size={16} />,
    match: ['/versions'],
  },
  {
    href: '/negotiations',
    label: 'Negociacion',
    icon: <Scale size={16} />,
    match: ['/negotiations'],
  },
  {
    href: '/signatures',
    label: 'Firma',
    icon: <FileSignature size={16} />,
    match: ['/signatures'],
  },
  {
    href: '/obligations',
    label: 'Obligaciones',
    icon: <CheckSquare size={16} />,
    match: ['/obligations'],
  },
  {
    href: '/milestones',
    label: 'Hitos',
    icon: <Activity size={16} />,
    match: ['/milestones'],
  },
  {
    href: '/payments',
    label: 'Pagos',
    icon: <Wallet size={16} />,
    match: ['/payments'],
  },
  {
    href: '/attachments',
    label: 'Anexos',
    icon: <Upload size={16} />,
    match: ['/attachments'],
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
                style={{
                  justifyContent: 'flex-start',
                  borderColor: active ? 'var(--accent)' : undefined,
                  background: active ? 'var(--accent-bg)' : undefined,
                  color: active ? 'var(--accent-strong)' : undefined,
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
