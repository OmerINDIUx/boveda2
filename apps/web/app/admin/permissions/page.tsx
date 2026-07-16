'use client';

import { useEffect, useState } from 'react';
import { RequirePermission } from '../../../components/auth/require-permission';
import { SectionHeader } from '../../../components/modules/section-header';
import { PermissionKey } from '../../../lib/permissions';
import { apiGet, apiPatch } from '../../../lib/api';
import { getSessionToken } from '../../../lib/auth';

type PermissionInfo = { id: string; key: string; label: string; module: string };
type RoleInfo = { id: string; key: string; name: string; permissions: PermissionInfo[] };

function getToken() {
  return getSessionToken();
}

export default function PermissionMatrixPage() {
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [rolesData, permissionsData] = await Promise.all([
          apiGet<RoleInfo[]>('/roles', getToken()),
          apiGet<PermissionInfo[]>('/roles/permissions', getToken()),
        ]);
        if (!active) return;
        setRoles(rolesData);
        setAllPermissions(permissionsData);
      } catch {
        if (active) setError('No fue posible cargar la matriz de permisos.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  function isAssigned(role: RoleInfo, permissionId: string) {
    return role.permissions.some((p) => p.id === permissionId);
  }

  async function togglePermission(role: RoleInfo, permissionId: string) {
    const newIds = isAssigned(role, permissionId)
      ? role.permissions.filter((p) => p.id !== permissionId).map((p) => p.id)
      : [...role.permissions.map((p) => p.id), permissionId];

    setSaving(role.id);
    setError('');
    setSuccess('');
    try {
      await apiPatch(`/roles/${role.id}/permissions`, { permissionIds: newIds }, getToken());
      setRoles((prev) =>
        prev.map((r) =>
          r.id === role.id
            ? {
                ...r,
                permissions: allPermissions.filter((p) => newIds.includes(p.id)),
              }
            : r
        )
      );
      setSuccess(`Permisos actualizados para "${role.name}"`);
    } catch {
      setError(`No fue posible actualizar los permisos de "${role.name}".`);
    } finally {
      setSaving(null);
    }
  }

  const sortedRoles = [...roles].sort((a, b) => a.key.localeCompare(b.key));
  const groupedPermissions = allPermissions.reduce(
    (acc, p) => {
      (acc[p.module] ??= []).push(p);
      return acc;
    },
    {} as Record<string, PermissionInfo[]>
  );

  return (
    <RequirePermission permission={PermissionKey.RolesManage}>
      <SectionHeader
        title="Matriz de permisos"
        description="Permisos por acción para roles del sistema. Marca o desmarca para asignar."
      />
      {error ? (
        <div className="card muted" style={{ color: 'var(--accent)' }}>
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="card muted" style={{ color: 'var(--primary)' }}>
          {success}
        </div>
      ) : null}
      <div className="card">
        {loading ? (
          <p className="muted">Cargando matriz de permisos...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Módulo</th>
                <th>Acción</th>
                {sortedRoles.map((role) => (
                  <th key={role.id} style={{ textAlign: 'center' }}>
                    {role.name}
                    {saving === role.id ? ' ⏳' : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedPermissions).map(([module, perms]) =>
                perms.map((permission) => (
                  <tr key={permission.id}>
                    <td>{module}</td>
                    <td>{permission.label}</td>
                    {sortedRoles.map((role) => (
                      <td key={role.id} style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isAssigned(role, permission.id)}
                          onChange={() => togglePermission(role, permission.id)}
                          disabled={saving === role.id}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </RequirePermission>
  );
}
