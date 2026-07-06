'use client';

import {
  Bell,
  Bot,
  ClipboardCheck,
  FileQuestion,
  FileText,
  FolderKanban,
  Gauge,
  Landmark,
  LockKeyhole,
  Settings2,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { hasPermission } from '../../lib/auth';
import { PermissionKey } from '../../lib/permissions';
import { LogoutButton } from '../auth/logout-button';
import { NotificationsBell } from './notifications-bell';

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: Gauge, permission: PermissionKey.ProjectsView },
  { href: '/projects', label: 'Proyectos', icon: FolderKanban, permission: PermissionKey.ProjectsView },
  { href: '/documents', label: 'Documentos por proyecto', icon: FileText, permission: PermissionKey.DocumentsView },
  { href: '/rfis', label: 'RFIs', icon: FileQuestion, permission: PermissionKey.RfisManage },
  { href: '/approvals', label: 'Aprobaciones', icon: ClipboardCheck, permission: PermissionKey.DocumentsApprove },
  { href: '/approvals/flows', label: 'Flujos aprobación', icon: ClipboardCheck, permission: PermissionKey.ApprovalsManage },
  { href: '/notifications', label: 'Notificaciones', icon: Bell, permission: null },
  { href: '/ai-query', label: 'Consulta IA', icon: Bot, permission: PermissionKey.AiQuery },
  { href: '/clm', label: 'CLM', icon: Landmark, permission: PermissionKey.ContractsManage },
  { href: '/admin/project-catalogs', label: 'Catálogos proyecto', icon: Settings2, permission: PermissionKey.ProjectsManage },
  { href: '/admin/project-disciplines', label: 'Disciplinas', icon: Settings2, permission: PermissionKey.ProjectsManage },
  { href: '/admin/project-users', label: 'Usuarios proyecto', icon: Settings2, permission: PermissionKey.ProjectsManage },
  { href: '/admin/users', label: 'Usuarios', icon: ShieldCheck, permission: PermissionKey.UsersRead },
  { href: '/admin/roles', label: 'Roles', icon: ShieldCheck, permission: PermissionKey.RolesRead }
];

export function Sidebar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const visibleItems = mounted ? items.filter((item) => (item.permission ? hasPermission(item.permission) : true)) : items;

  return (
    <aside className="sidebar">
      <Link className="brand" href="/dashboard">
        <LockKeyhole size={24} />
        <span>Holocron</span>
      </Link>
      <NotificationsBell />
      <nav className="nav">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link href={item.href} key={item.href}>
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <LogoutButton />
      </nav>
    </aside>
  );
}
