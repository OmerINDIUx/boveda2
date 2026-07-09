'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Bot,
  ClipboardCheck,
  Command,
  FileQuestion,
  FileText,
  FolderKanban,
  Gauge,
  Landmark,
  LogOut,
  Search,
  Settings2,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LanguageSwitcher } from './language-switcher';

const searchItems = [
  { href: '/dashboard', label: 'Panel', icon: Gauge, section: 'Principal' },
  { href: '/projects', label: 'Proyectos', icon: FolderKanban, section: 'Gestión' },
  { href: '/documents', label: 'Documentos', icon: FileText, section: 'Gestión' },
  { href: '/rfis', label: 'Consultas', icon: FileQuestion, section: 'Gestión' },
  { href: '/approvals', label: 'Aprobaciones', icon: ClipboardCheck, section: 'Gestión' },
  { href: '/clm', label: 'Contratos', icon: Landmark, section: 'Gestión' },
  { href: '/notifications', label: 'Notificaciones', icon: Bell, section: 'Utilidades' },
  { href: '/ai-query', label: 'Consulta IA', icon: Bot, section: 'Utilidades' },
  { href: '/admin/users', label: 'Usuarios', icon: ShieldCheck, section: 'Administración' },
  { href: '/admin/roles', label: 'Roles', icon: ShieldCheck, section: 'Administración' },
  {
    href: '/admin/project-catalogs',
    label: 'Catálogos',
    icon: Settings2,
    section: 'Administración',
  },
  {
    href: '/admin/project-disciplines',
    label: 'Disciplinas',
    icon: Settings2,
    section: 'Administración',
  },
];

export function TopBar() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotifOpen(false);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query
    ? searchItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.section.toLowerCase().includes(query.toLowerCase())
      )
    : searchItems;

  const pageTitle = searchItems.find((i) => pathname.startsWith(i.href))?.label || 'Panel';

  return (
    <>
      {/* TopBar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '3.5rem',
          padding: '0 1.25rem',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        {/* Left: page indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link
            href="/dashboard"
            style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--color-primary)' }}
          >
            Holocron
          </Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
            {pageTitle}
          </span>
        </div>

        {/* Center: Search */}
        <div ref={searchRef} style={{ position: 'relative', width: 'min(360px, 100%)' }}>
          <button
            onClick={() => {
              setSearchOpen(true);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              minHeight: '2.25rem',
              padding: '0 0.75rem',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--surface-strong)',
              color: 'var(--text-secondary)',
              fontSize: 'var(--font-sm)',
              cursor: 'pointer',
              transition: 'border-color 160ms ease',
            }}
          >
            <Search size={16} />
            <span style={{ flex: 1, textAlign: 'left' }}>Buscar en Holocron...</span>
            <kbd
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                padding: '2px 6px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'inherit',
                color: 'var(--text-tertiary)',
                background: 'var(--surface)',
              }}
            >
              <Command size={12} />K
            </kbd>
          </button>

          {/* Search dropdown */}
          {searchOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                zIndex: 50,
                overflow: 'hidden',
                maxHeight: 'min(60vh, 480px)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    border: '1px solid var(--color-primary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0 0.625rem',
                  }}
                >
                  <Search size={16} style={{ color: 'var(--color-primary)' }} />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Buscar páginas..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{
                      flex: 1,
                      minHeight: '2rem',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontSize: 'var(--font-base)',
                    }}
                  />
                </div>
              </div>
              <div style={{ overflow: 'auto', padding: '0.5rem' }}>
                {filtered.length === 0 && (
                  <div
                    style={{
                      padding: '1rem',
                      textAlign: 'center',
                      color: 'var(--text-tertiary)',
                      fontSize: 'var(--font-sm)',
                    }}
                  >
                    Sin resultados
                  </div>
                )}
                {filtered.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      setSearchOpen(false);
                      setQuery('');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text)',
                      textDecoration: 'none',
                      fontSize: 'var(--font-sm)',
                      transition: 'background 120ms ease',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'var(--surface-strong)')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <item.icon size={16} style={{ color: 'var(--color-primary)' }} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
                      {item.section}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Language + Notifications + User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LanguageSwitcher />
          {/* Notifications */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                cursor: 'pointer',
                position: 'relative',
                color: 'var(--text-secondary)',
                transition: 'background 120ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-strong)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface)')}
            >
              <Bell size={18} />
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 18,
                  height: 18,
                  borderRadius: '999px',
                  background: 'var(--color-danger)',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                3
              </span>
            </button>

            {notifOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  width: 320,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-xl)',
                  zIndex: 50,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <strong style={{ fontSize: 'var(--font-sm)' }}>Notificaciones</strong>
                  <Link
                    href="/notifications"
                    style={{ fontSize: 'var(--font-xs)', color: 'var(--color-primary)' }}
                    onClick={() => setNotifOpen(false)}
                  >
                    Ver todas
                  </Link>
                </div>
                <div style={{ padding: '0.5rem', maxHeight: 300, overflow: 'auto' }}>
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        padding: '0.625rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '2px',
                        borderLeft: '3px solid var(--color-primary)',
                        background: 'var(--color-primary-light)',
                        cursor: 'pointer',
                        transition: 'background 120ms ease',
                      }}
                    >
                      <div style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>
                        Documento vencido
                      </div>
                      <div
                        style={{
                          fontSize: 'var(--font-xs)',
                          color: 'var(--text-secondary)',
                          marginTop: '2px',
                        }}
                      >
                        Plano estructural A-102 ha vencido
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: '2.25rem',
                padding: '0 0.75rem 0 0.5rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface)',
                cursor: 'pointer',
                color: 'var(--text)',
                transition: 'background 120ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-strong)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface)')}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '999px',
                  background: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 700,
                }}
              >
                U
              </div>
              <span className="topbar-user-name">Usuario</span>
            </button>

            {userMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  width: 200,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-xl)',
                  zIndex: 50,
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>Usuario Demo</div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                    admin@empresa.com
                  </div>
                </div>
                <div style={{ padding: '0.5rem' }}>
                  <button
                    onClick={() => {
                      window.localStorage.removeItem('holocron_token');
                      window.localStorage.removeItem('holocron_user');
                      window.location.href = '/login';
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: 'var(--color-danger)',
                      fontSize: 'var(--font-sm)',
                      transition: 'background 120ms ease',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'var(--color-danger-light)')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <LogOut size={16} />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
