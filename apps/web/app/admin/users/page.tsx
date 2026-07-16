'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RequirePermission } from '../../../components/auth/require-permission';
import { ModuleTable } from '../../../components/modules/module-table';
import { SectionHeader } from '../../../components/modules/section-header';
import { PermissionKey } from '../../../lib/permissions';
import { apiGet } from '../../../lib/api';
import { getSessionToken } from '../../../lib/auth';

type RoleInfo = { id: string; key: string; name: string };
type UserData = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  roles: RoleInfo[];
};

function getToken() {
  return getSessionToken();
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await apiGet<UserData[]>('/users', getToken());
        if (active) setUsers(data);
      } catch {
        if (active) setError('No fue posible cargar los usuarios.');
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
    <RequirePermission permission={PermissionKey.UsersRead}>
      <SectionHeader
        title="Usuarios"
        description="Registro interno, estado de acceso y roles asignados."
        action="Nuevo usuario"
        actionHref="/admin/users/new"
      />
      <div className="card">
        {loading ? (
          <p className="muted">Cargando usuarios...</p>
        ) : error ? (
          <p className="muted">{error}</p>
        ) : (
          <ModuleTable
            columns={['Nombre', 'Correo', 'Estado', 'Roles', 'Acción']}
            rows={users.map((user) => [
              user.name,
              user.email,
              <span className={`pill ${user.active ? '' : 'danger'}`} key={`status-${user.id}`}>
                {user.active ? 'Activo' : 'Inactivo'}
              </span>,
              user.roles.map((r) => r.name).join(', ') || 'Sin rol',
              <Link href={`/admin/users/${user.id}/edit`} key={`edit-${user.id}`}>
                Editar
              </Link>,
            ])}
          />
        )}
      </div>
    </RequirePermission>
  );
}
