'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RequirePermission } from '../../../../components/auth/require-permission';
import { SectionHeader } from '../../../../components/modules/section-header';
import { PermissionKey } from '../../../../lib/permissions';
import { apiGet, apiPost } from '../../../../lib/api';
import { getSessionToken } from '../../../../lib/auth';

type RoleOption = { id: string; key: string; name: string };

function getToken() {
  return getSessionToken();
}

export default function UserFormPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadRoles() {
      try {
        const data = await apiGet<RoleOption[]>('/roles', getToken());
        if (active) setRoles(data);
      } catch {
        if (active) setError('No fue posible cargar la lista de roles.');
      }
    }
    void loadRoles();
    return () => {
      active = false;
    };
  }, []);

  function toggleRole(id: string) {
    setRoleIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  }

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || !password) {
      setError('Completa nombre, correo y contraseña.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiPost(
        '/users',
        { name: name.trim(), email: email.trim(), password, roleIds },
        getToken()
      );
      router.push('/admin/users');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible crear el usuario.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <RequirePermission permission={PermissionKey.UsersManage}>
      <SectionHeader title="Nuevo usuario" description="Alta interna, perfil, estado y roles." />
      <section className="grid">
        <form
          className="card span-6"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
        >
          {error ? (
            <p className="muted" style={{ color: 'var(--accent)' }}>
              {error}
            </p>
          ) : null}
          <div className="field">
            <label>Nombre</label>
            <input
              placeholder="Nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Correo</label>
            <input
              type="email"
              placeholder="usuario@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Contraseña temporal</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="field">
            <label>Roles</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {roles.map((role) => (
                <label key={role.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={roleIds.includes(role.id)}
                    onChange={() => toggleRole(role.id)}
                  />
                  {role.name}
                </label>
              ))}
              {!roles.length ? <p className="muted">Cargando roles...</p> : null}
            </div>
          </div>
          <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Usuario activo
          </label>
          <button className="button" type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar usuario'}
          </button>
        </form>
      </section>
    </RequirePermission>
  );
}
