'use client';
import { RequirePermission } from '../../../../components/auth/require-permission';
import { PermissionKey } from '../../../../lib/permissions';

export default function Page() {
  return (
    <RequirePermission permission={PermissionKey.ContractsManage}>
      <section className="projects-workspace">
        <div className="topbar">
          <div>
            <h1>Integración ERP</h1>
            <p className="muted">Configuración de integración con sistemas externos.</p>
          </div>
        </div>
        <article className="card">
          <div className="panel-header">
            <h2>Proveedor ERP</h2>
          </div>
          <div className="simple-document-list">
            <div className="simple-document-item">
              <strong>Stub ERP (modo simulación)</strong>
              <span>Conectado correctamente. Los datos se sincronizan en modo simulación.</span>
            </div>
          </div>
          <div className="field">
            <label>Estado</label>
            <span className="pill success">Conectado (simulación)</span>
          </div>
        </article>
      </section>
    </RequirePermission>
  );
}
