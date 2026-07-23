'use client';
import { useEffect, useState } from 'react';
import { RequirePermission } from '../../../../components/auth/require-permission';
import { Button } from '../../../../components/ui/button';
import { apiGet, apiPost } from '../../../../lib/api';
import { PermissionKey } from '../../../../lib/permissions';

type IntegrationStatus = {
  signature: { provider: string; configured: boolean; simulated: boolean };
  erp: { provider: string; configured: boolean; simulated: boolean };
};

export default function Page() {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [message, setMessage] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    apiGet<IntegrationStatus>('/clm/integrations/status')
      .then(setStatus)
      .catch((error) =>
        setMessage(error instanceof Error ? error.message : 'No se pudo consultar la integración.')
      );
  }, []);

  async function testConnection() {
    setTesting(true);
    setMessage('');
    try {
      const result = await apiPost<{ connected: boolean; message: string }>(
        '/clm/integrations/erp/test',
        {}
      );
      setMessage(result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo probar la conexión.');
    } finally {
      setTesting(false);
    }
  }

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
              <strong>
                {status ? `Proveedor ${status.erp.provider}` : 'Consultando proveedor...'}
              </strong>
              <span>
                {status?.erp.simulated
                  ? 'Modo de desarrollo: no se transmiten datos a un ERP real.'
                  : status?.erp.configured
                    ? 'Configuración externa disponible.'
                    : 'Integración deshabilitada o incompleta.'}
              </span>
            </div>
            {status ? (
              <div className="simple-document-item">
                <strong>Firma electrónica: {status.signature.provider}</strong>
                <span>
                  {status.signature.simulated
                    ? 'Modo de desarrollo.'
                    : status.signature.configured
                      ? 'Configurada.'
                      : 'Deshabilitada o incompleta.'}
                </span>
              </div>
            ) : null}
          </div>
          <div className="field">
            <label>Estado</label>
            <span className={`pill ${status?.erp.configured ? 'success' : 'warning'}`}>
              {status?.erp.configured ? 'Configurado' : 'No configurado'}
            </span>
          </div>
          <Button loading={testing} onClick={() => void testConnection()}>
            Probar conexión
          </Button>
          {message ? <p className="muted">{message}</p> : null}
        </article>
      </section>
    </RequirePermission>
  );
}
