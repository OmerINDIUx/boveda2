import Link from 'next/link';
import { RequirePermission } from '../../../components/auth/require-permission';
import { ModuleTable } from '../../../components/modules/module-table';
import { SectionHeader } from '../../../components/modules/section-header';
import { PermissionKey } from '../../../lib/permissions';

export default function RolesPage() {
  return (
    <RequirePermission permission={PermissionKey.RolesRead}>
      <SectionHeader
        title="Roles"
        description="Perfiles operativos y permisos asignados."
        action="Nuevo rol"
      />
      <div className="card">
        <ModuleTable
          columns={['Rol', 'Descripcion', 'Permisos', 'Accion']}
          rows={[
            [
              'Administrador',
              'Acceso total',
              'Todos',
              <Link href="/admin/permissions">Matriz</Link>,
            ],
            [
              'Gerente de proyecto',
              'Gestion por proyecto',
              'Documentos, RFIs, CLM',
              <Link href="/admin/permissions">Matriz</Link>,
            ],
            [
              'Consulta',
              'Solo lectura asignada',
              'Ver/descargar',
              <Link href="/admin/permissions">Matriz</Link>,
            ],
          ]}
        />
      </div>
    </RequirePermission>
  );
}
