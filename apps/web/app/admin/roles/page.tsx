'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RequirePermission } from '../../../components/auth/require-permission';
import { ModuleTable } from '../../../components/modules/module-table';
import { SectionHeader } from '../../../components/modules/section-header';
import { PermissionKey } from '../../../lib/permissions';
import { apiGet } from '../../../lib/api';
import { getSessionToken } from '../../../lib/auth';

type RoleData = {
  id: string;
  key: string;
  name: string;
  description?: string;
  permissions: Array<{ id: string; key: string; label: string }>;
};

function getToken() {
  return getSessionToken();
}

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await apiGet<RoleData[]>('/roles', getToken());
        if (active) setRoles(data);
      } catch {
        if (active) setError('No fue posible cargar los roles.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <RequirePermission permission={PermissionKey.RolesRead}>
      <SectionHeader
        title="Roles"
        description="Perfiles operativos y permisos asignados."
        action="Nuevo rol"
      />
      <div className="card">
        {loading ? (
          <p className="muted">Cargando roles...</p>
        ) : error ? (
          <p className="muted">{error}</p>
        ) : (
          <ModuleTable
            columns={['Rol', 'Descripción', 'Permisos', 'Acción']}
            rows={roles.map((role) => [
              role.name,
              role.description ?? '',
              role.permissions.length ? role.permissions.map((p) => p.label).join(', ') : 'Ninguno',
              <Link href="/admin/permissions" key={`matrix-${role.id}`}>
                Matriz
              </Link>,
            ])}
          />
        )}
      </div>
    </RequirePermission>
  );
}
