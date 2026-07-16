'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Check, ChevronLeft, PencilLine } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../../../lib/api';
import { getToken, type BitacoraDetail } from './types';

export function BitacoraDetailPage() {
  const params = useParams<{ id: string; entryId: string }>();
  const projectId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const entryId = Array.isArray(params?.entryId) ? params.entryId[0] : params?.entryId;
  const [entry, setEntry] = useState<BitacoraDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signing, setSigning] = useState(false);
  const [confirmSign, setConfirmSign] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!entryId) return;
      setLoading(true);
      setError('');
      try {
        const response = await apiGet<BitacoraDetail>(`/bitacoras/${entryId}`, getToken());
        if (!active) return;
        setEntry(response);
      } catch {
        if (!active) return;
        setError('No fue posible cargar la entrada.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [entryId]);

  async function handleSign() {
    if (!entryId) return;
    setSigning(true);
    setError('');
    try {
      const updated = await apiPost<BitacoraDetail>(`/bitacoras/${entryId}/sign`, {}, getToken());
      setEntry(updated);
      setConfirmSign(false);
    } catch {
      setError('No fue posible firmar la entrada.');
    } finally {
      setSigning(false);
    }
  }

  if (loading) {
    return (
      <section className="projects-workspace">
        <article className="card">
          <p className="muted">Cargando entrada...</p>
        </article>
      </section>
    );
  }

  if (!entry || error) {
    return (
      <section className="projects-workspace">
        <article className="card">
          <p className="muted">{error || 'Entrada no encontrada.'}</p>
        </article>
      </section>
    );
  }

  const clima = entry.clima as unknown as Record<string, unknown> | null;
  const actividades = entry.actividades as unknown as Array<Record<string, unknown>> | null;
  const personal = entry.personal as unknown as Array<Record<string, unknown>> | null;
  const equipos = entry.equipos as unknown as Array<Record<string, unknown>> | null;
  const materiales = entry.materialesRecibidos as unknown as Array<Record<string, unknown>> | null;
  const incidentes = entry.incidentes as unknown as Array<Record<string, unknown>> | null;

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>
            Bitácora #{entry.folio} - {entry.fecha}
          </h1>
          <p className="muted">
            {entry.turno} | Creado por {entry.createdBy?.name ?? 'Desconocido'}
          </p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={`/projects/${projectId}/bitacoras`}>
            <ChevronLeft size={18} />
            Volver
          </Link>
          {entry.estado === 'borrador' && (
            <>
              <Link
                className="button secondary"
                href={`/projects/${projectId}/bitacoras/${entry.id}/edit`}
              >
                <PencilLine size={18} />
                Editar
              </Link>
              <button className="button" type="button" onClick={() => setConfirmSign(true)}>
                <Check size={18} />
                Firmar
              </button>
            </>
          )}
        </div>
      </div>

      {confirmSign && (
        <article className="card" style={{ border: '2px solid var(--color-warning)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <strong style={{ fontSize: 16 }}>¿Firmar entrada #{entry.folio}?</strong>
              <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                Al firmar, la entrada quedará cerrada para edición.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="button secondary"
                type="button"
                onClick={() => setConfirmSign(false)}
                disabled={signing}
              >
                Cancelar
              </button>
              <button className="button" type="button" onClick={handleSign} disabled={signing}>
                {signing ? 'Firmando...' : 'Confirmar firma'}
              </button>
            </div>
          </div>
        </article>
      )}

      {error ? (
        <div className="card muted" style={{ color: 'var(--color-danger)' }}>
          {error}
        </div>
      ) : null}

      <div className="grid" style={{ marginTop: 16 }}>
        <article className="card span-4">
          <div className="panel-header">
            <h2>Información general</h2>
            <span
              className={`pill ${entry.estado === 'firmado' ? 'success' : entry.estado === 'borrador' ? 'warning' : ''}`}
            >
              {entry.estado === 'firmado'
                ? 'Firmado'
                : entry.estado === 'borrador'
                  ? 'Borrador'
                  : 'Cerrado'}
            </span>
          </div>
          <div className="project-state-grid">
            <div className="state-card">
              <span>Folio</span>
              <strong>#{entry.folio}</strong>
            </div>
            <div className="state-card">
              <span>Fecha</span>
              <strong>{entry.fecha}</strong>
            </div>
            <div className="state-card">
              <span>Turno</span>
              <strong>{entry.turno}</strong>
            </div>
            <div className="state-card">
              <span>Avance</span>
              <strong>{entry.avanceEstimado ?? 0}%</strong>
            </div>
          </div>
        </article>

        {clima && (
          <article className="card span-2">
            <div className="panel-header">
              <h2>Clima</h2>
            </div>
            <p>{JSON.stringify(clima)}</p>
          </article>
        )}

        {entry.descripcionGeneral && (
          <article className="card span-4">
            <div className="panel-header">
              <h2>Descripción General</h2>
            </div>
            <p>{entry.descripcionGeneral}</p>
          </article>
        )}

        {actividades?.length ? (
          <article className="card span-4">
            <div className="panel-header">
              <h2>Actividades Realizadas</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Área</th>
                  <th>Descripción</th>
                  <th>Avance</th>
                </tr>
              </thead>
              <tbody>
                {actividades.map((a, i) => (
                  <tr key={i}>
                    <td>{(a as any).area ?? ''}</td>
                    <td>{(a as any).descripcion ?? ''}</td>
                    <td>{(a as any).avance_porcentaje ?? ''}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        ) : null}

        {personal?.length ? (
          <article className="card span-2">
            <div className="panel-header">
              <h2>Personal</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Oficio</th>
                  <th>Cantidad</th>
                  <th>Horas</th>
                </tr>
              </thead>
              <tbody>
                {personal.map((p, i) => (
                  <tr key={i}>
                    <td>{(p as any).oficio ?? ''}</td>
                    <td>{(p as any).cantidad ?? ''}</td>
                    <td>{(p as any).horas_trabajadas ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        ) : null}

        {equipos?.length ? (
          <article className="card span-2">
            <div className="panel-header">
              <h2>Equipos</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Equipo</th>
                  <th>Cantidad</th>
                  <th>Horas</th>
                </tr>
              </thead>
              <tbody>
                {equipos.map((e, i) => (
                  <tr key={i}>
                    <td>{(e as any).nombre ?? ''}</td>
                    <td>{(e as any).cantidad ?? ''}</td>
                    <td>{(e as any).horas_operacion ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        ) : null}

        {materiales?.length ? (
          <article className="card span-2">
            <div className="panel-header">
              <h2>Materiales Recibidos</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Cantidad</th>
                  <th>Proveedor</th>
                </tr>
              </thead>
              <tbody>
                {materiales.map((m, i) => (
                  <tr key={i}>
                    <td>{(m as any).nombre ?? ''}</td>
                    <td>
                      {(m as any).cantidad ?? ''} {(m as any).unidad ?? ''}
                    </td>
                    <td>{(m as any).proveedor ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        ) : null}

        {incidentes?.length ? (
          <article className="card span-2">
            <div className="panel-header">
              <h2>Incidentes</h2>
            </div>
            {incidentes.map((i, idx) => (
              <div key={idx} style={{ marginBottom: '0.5rem' }}>
                <strong>{(i as any).tipo ?? ''}:</strong> {(i as any).descripcion ?? ''}
                {(i as any).impacto ? ` (Impacto: ${(i as any).impacto})` : ''}
              </div>
            ))}
          </article>
        ) : null}

        {entry.seguridad && (
          <article className="card span-2">
            <div className="panel-header">
              <h2>Seguridad</h2>
            </div>
            <p>{entry.seguridad}</p>
          </article>
        )}

        {entry.calidad && (
          <article className="card span-2">
            <div className="panel-header">
              <h2>Calidad</h2>
            </div>
            <p>{entry.calidad}</p>
          </article>
        )}

        {entry.observaciones && (
          <article className="card span-4">
            <div className="panel-header">
              <h2>Observaciones</h2>
            </div>
            <p>{entry.observaciones}</p>
          </article>
        )}

        {entry.fotos?.length ? (
          <article className="card span-4">
            <div className="panel-header">
              <h2>Fotos ({entry.fotos.length})</h2>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '1rem',
              }}
            >
              {entry.fotos.map((foto) => (
                <div
                  key={foto.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={foto.filePath}
                    alt={foto.descripcion ?? ''}
                    style={{ width: '100%', height: 160, objectFit: 'cover' }}
                  />
                  {foto.descripcion && (
                    <p style={{ padding: '0.5rem', fontSize: '0.8rem' }}>{foto.descripcion}</p>
                  )}
                </div>
              ))}
            </div>
          </article>
        ) : null}

        {entry.history?.length ? (
          <article className="card span-4">
            <div className="panel-header">
              <h2>Historial de cambios</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Acción</th>
                  <th>Usuario</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {entry.history.map((h) => (
                  <tr key={h.id}>
                    <td>{h.accion}</td>
                    <td>{h.actor?.name ?? 'Sistema'}</td>
                    <td>{new Date(h.createdAt).toLocaleString('es-MX')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        ) : null}
      </div>
    </section>
  );
}
