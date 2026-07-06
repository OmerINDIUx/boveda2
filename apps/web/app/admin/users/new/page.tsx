import { RequirePermission } from '../../../../components/auth/require-permission';
import { SectionHeader } from '../../../../components/modules/section-header';
import { PermissionKey } from '../../../../lib/permissions';

export default function UserFormPage() {
  return (
    <RequirePermission permission={PermissionKey.UsersManage}>
      <SectionHeader
        title="Formulario de usuario"
        description="Alta interna, perfil, estado y roles."
      />
      <section className="grid">
        <form className="card span-6">
          <div className="field">
            <label>Nombre</label>
            <input placeholder="Nombre completo" />
          </div>
          <div className="field">
            <label>Correo</label>
            <input type="email" placeholder="usuario@empresa.com" />
          </div>
          <div className="field">
            <label>Contrasena temporal</label>
            <input type="password" />
          </div>
          <div className="field">
            <label>Rol</label>
            <select>
              <option>Administrador</option>
              <option>Gerente de proyecto</option>
              <option>Consulta</option>
            </select>
          </div>
          <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
            <input type="checkbox" defaultChecked />
            Usuario activo
          </label>
          <button className="button" type="button">
            Guardar usuario
          </button>
        </form>
      </section>
    </RequirePermission>
  );
}
