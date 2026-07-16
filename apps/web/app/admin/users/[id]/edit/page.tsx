'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RequirePermission } from '../../../../../components/auth/require-permission';
import { SectionHeader } from '../../../../../components/modules/section-header';
import { PermissionKey } from '../../../../../lib/permissions';
import { apiGet, apiPatch } from '../../../../../lib/api';
import { getSessionToken } from '../../../../../lib/auth';

type RoleOption = { id: string; key: string; name: string };

function getToken() {
  return getSessionToken();
}

export default function EditUserPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const userId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    let active = true;

    async function load() {
      try {
        const [userData, rolesData] = await Promise.all([
          apiGet<{
            id: string;
            name: string;
            email: string;
            active: boolean;
            roles: RoleOption[];
          }>(`/users/${userId}`, getToken()),
          apiGet<RoleOption[]>('/roles', getToken()),
        ]);
        if (!active) return;
        setName(userData.name);
        setEmail(userData.email);
        setActive(userData.active);
        setRoleIds(userData.roles.map((r) => r.id));
        setRoles(rolesData);
      } catch {
        if (active) setError('No fue posible cargar el usuario.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [userId]);

  function toggleRole(id: string) {
    setRoleIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  }

  async function handleSubmit() {
    if (!name.trim() || !email.trim()) {
      setError('Completa nombre y correo.');
      return;
    }
    if (!userId) return;

    setSaving(true);
    setError('');
    try {
      await apiPatch(
        `/users/${userId}`,
        {
          name: name.trim(),
          email: email.trim(),
          active,
          ...(password ? { password } : {}),
          roleIds,
        },
        getToken()
      );
      router.push('/admin/users');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible actualizar el usuario.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <RequirePermission permission={PermissionKey.UsersManage}>
      <SectionHeader title="Editar usuario" description="Modificar perfil, estado y roles." />
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
          {loading ? (
            <p className="muted">Cargando usuario...</p>
          ) : (
            <>
              <div className="field">
                <label>Nombre</label>
                <input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="field">
                <label>Correo</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="field">
                <label>Nueva contraseña (dejar vacío para mantener)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
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
                </div>
              </div>
              <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                Usuario activo
              </label>
              <button className="button" type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </>
          )}
        </form>
      </section>
    </RequirePermission>
  );
}
