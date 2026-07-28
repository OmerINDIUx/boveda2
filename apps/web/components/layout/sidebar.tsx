'use client';

import {
  Bell,
  Bot,
  ClipboardCheck,
  Clock,
  FileQuestion,
  FolderKanban,
  Gauge,
  GitBranch,
  Landmark,
  Mail,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { hasPermission } from '../../lib/auth';
import { brand } from '../../lib/brand';
import { PermissionKey } from '../../lib/permissions';

type NavItem = {
  href: string;
  label: string;
  icon: typeof Gauge;
  permission: string | null;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const groups: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard', label: 'Panel', icon: Gauge, permission: PermissionKey.ProjectsView },
    ],
  },
  {
    label: 'Gestión',
    items: [
      {
        href: '/projects',
        label: 'Centros de costos',
        icon: FolderKanban,
        permission: PermissionKey.ProjectsView,
      },
      {
        href: '/rfis',
        label: 'Consultas',
        icon: FileQuestion,
        permission: PermissionKey.RfisManage,
      },
      {
        href: '/approvals',
        label: 'Aprobaciones',
        icon: ClipboardCheck,
        permission: PermissionKey.DocumentsApprove,
      },
      {
        href: '/approvals/flows',
        label: 'Flujos',
        icon: GitBranch,
        permission: PermissionKey.ApprovalsManage,
      },
      {
        href: '/clm',
        label: 'Contratos',
        icon: Landmark,
        permission: PermissionKey.ContractsManage,
      },
      {
        href: '/emails',
        label: 'Correos',
        icon: Mail,
        permission: PermissionKey.EmailsView,
      },
      {
        href: '/slas',
        label: 'SLAs',
        icon: Clock,
        permission: PermissionKey.SlaManage,
      },
    ],
  },
  {
    label: 'Administración',
    items: [
      { href: '/admin/users', label: 'Usuarios', icon: Users, permission: PermissionKey.UsersRead },
      {
        href: '/admin/roles',
        label: 'Roles',
        icon: ShieldCheck,
        permission: PermissionKey.RolesRead,
      },
      {
        href: '/admin/project-catalogs',
        label: 'Catálogos',
        icon: Settings2,
        permission: PermissionKey.ProjectsManage,
      },
      {
        href: '/admin/project-disciplines',
        label: 'Disciplinas',
        icon: Settings2,
        permission: PermissionKey.ProjectsManage,
      },
      {
        href: '/admin/project-users',
        label: 'Usuarios Proy.',
        icon: Users,
        permission: PermissionKey.ProjectsManage,
      },
    ],
  },
  {
    label: 'Utilidades',
    items: [
      {
        href: '/ai-query',
        label: 'Consulta con G.OTA',
        icon: Bot,
        permission: PermissionKey.AiQuery,
      },
      { href: '/notifications', label: 'Notificaciones', icon: Bell, permission: null },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const visibleGroups = mounted
    ? groups
        .map((g) => ({
          ...g,
          items: g.items.filter((item) =>
            item.permission ? hasPermission(item.permission) : true
          ),
        }))
        .filter((g) => g.items.length > 0)
    : groups;

  const sidebarWidth = collapsed ? '3.5rem' : '250px';

  const sidebarStyle: React.CSSProperties = {
    width: sidebarWidth,
    background: '#111827',
    color: '#cbd5e1',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'sticky',
    top: 0,
    transition: 'width 200ms ease',
    overflow: 'hidden',
    zIndex: 30,
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 98,
            background: 'rgba(0,0,0,0.4)',
            animation: 'fadeOverlay 200ms ease',
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        style={{
          ...sidebarStyle,
          position: 'fixed',
          left: mobileOpen ? 0 : '-100%',
          zIndex: 99,
          width: '250px',
          transition: 'left 200ms ease',
        }}
        aria-label="Navegación principal"
      >
        <SidebarContent
          groups={visibleGroups}
          pathname={pathname}
          collapsed={false}
          onToggle={() => {}}
          mobile
          onNavigate={() => setMobileOpen(false)}
        />
      </aside>

      {/* Desktop sidebar */}
      <aside style={sidebarStyle} aria-label="Navegación principal">
        <SidebarContent
          groups={visibleGroups}
          pathname={pathname}
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          mobile={false}
          onNavigate={() => {}}
        />
      </aside>

      {/* Mobile hamburger trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        style={{
          display: 'none',
          position: 'fixed',
          bottom: '1rem',
          right: '1rem',
          zIndex: 50,
          width: '3rem',
          height: '3rem',
          borderRadius: '999px',
          background: 'var(--color-primary)',
          color: '#fff',
          border: 'none',
          boxShadow: 'var(--shadow-lg)',
          cursor: 'pointer',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        className="mobile-fab"
        aria-label="Abrir menú"
      >
        <PanelLeftOpen size={20} />
      </button>

      <style>{`
        @media (max-width: 920px) {
          aside:not([aria-label="Navegación principal"]):nth-child(4) { display: none; }
          .mobile-fab { display: flex !important; }
        }
      `}</style>
    </>
  );
}

function SidebarContent({
  groups,
  pathname,
  collapsed,
  onToggle,
  mobile,
  onNavigate,
}: {
  groups: NavGroup[];
  pathname: string;
  collapsed: boolean;
  onToggle: () => void;
  mobile: boolean;
  onNavigate: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '0.75rem 0' : '1rem 1rem 0.75rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {collapsed ? (
          <Image
            src={brand.logo}
            alt="Holocom"
            width={28}
            height={28}
            style={{
              width: 28,
              height: 28,
              flexShrink: 0,
              objectFit: 'contain',
            }}
          />
        ) : (
          <>
            <Link
              href="/dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#f9fafb',
                textDecoration: 'none',
              }}
            >
              <Image
                src={brand.logo}
                alt="Holocom"
                width={28}
                height={28}
                style={{
                  width: 28,
                  height: 28,
                  flexShrink: 0,
                  objectFit: 'contain',
                }}
              />
              <span style={{ display: 'grid', lineHeight: 1.05 }}>
                <span style={{ fontSize: '1.125rem', fontWeight: 800 }}>Holocron</span>
                <span
                  style={{
                    marginTop: '0.2rem',
                    color: '#9fc5ff',
                    fontSize: '0.575rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Holocom
                </span>
              </span>
            </Link>
            {!mobile && (
              <button
                onClick={onToggle}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  borderRadius: '6px',
                  transition: 'color 120ms ease, background 120ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#f9fafb';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#64748b';
                  e.currentTarget.style.background = 'transparent';
                }}
                aria-label="Colapsar sidebar"
              >
                <PanelLeftClose size={16} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflow: 'auto', padding: collapsed ? '0.5rem 0' : '0.75rem' }}>
        {groups.map((group) => (
          <div key={group.label} style={{ marginBottom: collapsed ? '0.75rem' : '1.25rem' }}>
            {/* Group label */}
            {!collapsed && (
              <div
                style={{
                  padding: '0 0.75rem',
                  marginBottom: '0.375rem',
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#64748b',
                }}
              >
                {group.label}
              </div>
            )}
            {/* Items */}
            <div style={{ display: 'grid', gap: '1px' }}>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      gap: '0.625rem',
                      minHeight: collapsed ? '2.5rem' : '2.25rem',
                      padding: collapsed ? '0' : '0 0.75rem',
                      borderRadius: collapsed ? '0' : 'var(--radius-md)',
                      color: isActive ? '#bfdbfe' : '#94a3b8',
                      textDecoration: 'none',
                      fontSize: 'var(--font-sm)',
                      fontWeight: isActive ? 600 : 400,
                      background: isActive ? 'rgba(0, 102, 249, 0.22)' : 'transparent',
                      position: 'relative',
                      transition: 'background 120ms ease, color 120ms ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                        e.currentTarget.style.color = '#e2e8f0';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#94a3b8';
                      }
                    }}
                  >
                    <Icon size={collapsed ? 20 : 18} style={{ flexShrink: 0 }} />
                    {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                    {/* Active indicator */}
                    {isActive && !collapsed && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 3,
                          height: '60%',
                          borderRadius: '0 3px 3px 0',
                          background: '#0066f9',
                        }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse button for collapsed mode */}
      {collapsed && !mobile && (
        <div style={{ padding: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={onToggle}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '2.25rem',
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              borderRadius: 'var(--radius-md)',
              transition: 'color 120ms ease, background 120ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#f9fafb';
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#64748b';
              e.currentTarget.style.background = 'transparent';
            }}
            aria-label="Expandir sidebar"
          >
            <PanelLeftOpen size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
