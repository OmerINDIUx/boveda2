import Link from 'next/link';
import { RequirePermission } from '../../../components/auth/require-permission';
import { ModuleTable } from '../../../components/modules/module-table';
import { SectionHeader } from '../../../components/modules/section-header';
import { PermissionKey } from '../../../lib/permissions';

export default function UsersPage() {
  return (
    <RequirePermission permission={PermissionKey.UsersRead}>
      <SectionHeader
        title="Usuarios"
        description="Registro interno, estado de acceso y roles asignados."
        action="Nuevo usuario"
      />
      <div className="card">
        <ModuleTable
          columns={['Nombre', 'Correo', 'Estado', 'Roles', 'Accion']}
          rows={[
            ['Admin Holocron', 'admin@empresa.com', <span className="pill">Activo</span>, 'Administrador', <Link href="/admin/users/new">Editar</Link>],
            ['Consulta Legal', 'legal@empresa.com', <span className="pill">Activo</span>, 'Consulta', <Link href="/admin/users/new">Editar</Link>]
          ]}
        />
      </div>
    </RequirePermission>
  );
}
