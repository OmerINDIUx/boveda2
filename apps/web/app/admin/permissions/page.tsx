import { RequirePermission } from '../../../components/auth/require-permission';
import { SectionHeader } from '../../../components/modules/section-header';
import { PermissionKey, permissionCatalog } from '../../../lib/permissions';

const roles = ['Administrador', 'Gerente de proyecto', 'Consulta'];

export default function PermissionMatrixPage() {
  return (
    <RequirePermission permission={PermissionKey.RolesManage}>
      <SectionHeader title="Matriz de permisos" description="Permisos por accion para roles del sistema." />
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Modulo</th>
              <th>Accion</th>
              {roles.map((role) => (
                <th key={role}>{role}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissionCatalog.map((permission) => (
              <tr key={permission.key}>
                <td>{permission.module}</td>
                <td>{permission.label}</td>
                {roles.map((role, index) => (
                  <td key={role}>
                    <input type="checkbox" defaultChecked={index === 0 || (index === 1 && permission.module !== 'Auditoria')} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </RequirePermission>
  );
}
