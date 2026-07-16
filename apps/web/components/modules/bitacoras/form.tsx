'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../../lib/api';
import {
  getToken,
  type BitacoraDetail,
  type Clima,
  type Actividad,
  type Personal,
  type Equipo,
  type Material,
  type Incidente,
  type PhotoInput,
  emptyActividad,
  emptyPersonal,
  emptyEquipo,
  emptyMaterial,
  emptyIncidente,
} from './types';

export function BitacoraFormPage() {
  const params = useParams<{ id: string; entryId: string }>();
  const projectId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const entryId = Array.isArray(params?.entryId) ? params.entryId[0] : params?.entryId;
  const isEditing = Boolean(entryId);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    turno: 'matutino',
    descripcionGeneral: '',
    seguridad: '',
    calidad: '',
    observaciones: '',
    avanceEstimado: 0,
  });
  const [clima, setClima] = useState<Clima>({ temperatura: '', condicion: '', humedad: '' });
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [incidentes, setIncidentes] = useState<Incidente[]>([]);
  const [fotos, setFotos] = useState<PhotoInput[]>([]);
  const [fotosPreview, setFotosPreview] = useState<string[]>([]);
  const [fotosExistentes, setFotosExistentes] = useState<
    Array<{ id: string; filePath: string; descripcion?: string }>
  >([]);

  useEffect(() => {
    if (!isEditing || !entryId) return;
    let active = true;
    async function load() {
      try {
        const response = await apiGet<BitacoraDetail>(`/bitacoras/${entryId}`, getToken());
        if (!active) return;
        setForm({
          fecha: response.fecha,
          turno: response.turno,
          descripcionGeneral: response.descripcionGeneral ?? '',
          seguridad: response.seguridad ?? '',
          calidad: response.calidad ?? '',
          observaciones: response.observaciones ?? '',
          avanceEstimado: response.avanceEstimado ?? 0,
        });
        if (response.clima) {
          const c = response.clima as Record<string, string>;
          setClima({
            temperatura: c.temperatura ?? '',
            condicion: c.condicion ?? '',
            humedad: c.humedad ?? '',
          });
        }
        if (response.actividades) setActividades(response.actividades as unknown as Actividad[]);
        if (response.personal) setPersonal(response.personal as unknown as Personal[]);
        if (response.equipos) setEquipos(response.equipos as unknown as Equipo[]);
        if (response.materialesRecibidos)
          setMateriales(response.materialesRecibidos as unknown as Material[]);
        if (response.incidentes) setIncidentes(response.incidentes as unknown as Incidente[]);
        if (response.fotos?.length)
          setFotosExistentes(
            response.fotos.map((f) => ({
              id: f.id,
              filePath: f.filePath,
              descripcion: f.descripcion,
            }))
          );
      } catch {
        // ignore
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [entryId]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.fecha) errs.fecha = 'La fecha es requerida';
    if (form.avanceEstimado < 0 || form.avanceEstimado > 100)
      errs.avanceEstimado = 'El avance debe estar entre 0 y 100';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function fileToInput(file: File): Promise<PhotoInput> {
    const base64Content = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('No fue posible leer el archivo'));
      reader.readAsDataURL(file);
    });
    return { fileName: file.name, mimeType: file.type || 'image/jpeg', base64Content };
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    const newFiles = Array.from(fileList);
    Promise.all(newFiles.map(fileToInput)).then((inputs) => {
      setFotos((prev) => [...prev, ...inputs]);
    });
    const previews = newFiles.map((f) => URL.createObjectURL(f));
    setFotosPreview((prev) => [...prev, ...previews]);
    e.target.value = '';
  }

  function removeFoto(index: number) {
    setFotos((prev) => prev.filter((_, i) => i !== index));
    setFotosPreview((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function removeFotoExistente(photoId: string) {
    try {
      await apiDelete(`/bitacoras/${entryId}/photos/${photoId}`, getToken());
      setFotosExistentes((prev) => prev.filter((f) => f.id !== photoId));
    } catch {
      setError('No fue posible eliminar la foto.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) return;
    if (!validate()) return;
    setSaving(true);
    setError('');
    try {
      const body = {
        ...form,
        clima,
        actividades,
        personal,
        equipos,
        materialesRecibidos: materiales,
        incidentes,
        fotos: fotos.length ? fotos : undefined,
      };
      if (isEditing) {
        await apiPatch(`/bitacoras/${entryId}`, body, getToken());
      } else {
        await apiPost('/bitacoras', { ...body, projectId }, getToken());
      }
      router.push(`/projects/${projectId}/bitacoras`);
    } catch {
      setError('No fue posible guardar la entrada.');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '0.5rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    fontFamily: 'inherit' as const,
  };
  const fieldStyle = { marginBottom: '0.75rem' };

  return (
    <section className="projects-workspace">
      <div className="topbar">
        <div>
          <h1>{isEditing ? 'Editar entrada' : 'Nueva entrada de bitácora'}</h1>
          <p className="muted">Registro diario de actividades de obra.</p>
        </div>
        <div className="projects-actions">
          <Link className="button secondary" href={`/projects/${projectId}/bitacoras`}>
            <ChevronLeft size={18} />
            Cancelar
          </Link>
        </div>
      </div>

      {error ? (
        <div className="card muted" style={{ color: 'var(--color-danger)' }}>
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit}>
        <article className="card">
          <div className="panel-header">
            <h2>Información general</h2>
          </div>
          <div className="quick-filters-grid">
            <div style={fieldStyle}>
              <label
                style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--muted)' }}
              >
                Fecha
              </label>
              <input
                type="date"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                required
                style={{
                  ...inputStyle,
                  borderColor: errors.fecha ? 'var(--color-danger)' : undefined,
                }}
              />
              {errors.fecha && (
                <span style={{ fontSize: 12, color: 'var(--color-danger)' }}>{errors.fecha}</span>
              )}
            </div>
            <div style={fieldStyle}>
              <label
                style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--muted)' }}
              >
                Turno
              </label>
              <select
                value={form.turno}
                onChange={(e) => setForm({ ...form, turno: e.target.value })}
                style={inputStyle}
              >
                <option value="matutino">Matutino</option>
                <option value="vespertino">Vespertino</option>
                <option value="nocturno">Nocturno</option>
              </select>
            </div>
            <div style={fieldStyle}>
              <label
                style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--muted)' }}
              >
                Avance estimado (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.avanceEstimado}
                onChange={(e) => setForm({ ...form, avanceEstimado: Number(e.target.value) })}
                style={{
                  ...inputStyle,
                  borderColor: errors.avanceEstimado ? 'var(--color-danger)' : undefined,
                }}
              />
              {errors.avanceEstimado && (
                <span style={{ fontSize: 12, color: 'var(--color-danger)' }}>
                  {errors.avanceEstimado}
                </span>
              )}
            </div>
          </div>
        </article>

        <article className="card">
          <div className="panel-header">
            <h2>Clima</h2>
          </div>
          <div className="quick-filters-grid">
            <div style={fieldStyle}>
              <label
                style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--muted)' }}
              >
                Temperatura (°C)
              </label>
              <input
                type="text"
                value={clima.temperatura}
                onChange={(e) => setClima({ ...clima, temperatura: e.target.value })}
                style={inputStyle}
                placeholder="Ej: 28"
              />
            </div>
            <div style={fieldStyle}>
              <label
                style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--muted)' }}
              >
                Condición
              </label>
              <select
                value={clima.condicion}
                onChange={(e) => setClima({ ...clima, condicion: e.target.value })}
                style={inputStyle}
              >
                <option value="">Seleccionar</option>
                <option value="despejado">Despejado</option>
                <option value="parcialmente nublado">Parcialmente nublado</option>
                <option value="nublado">Nublado</option>
                <option value="lluvia ligera">Lluvia ligera</option>
                <option value="lluvia intensa">Lluvia intensa</option>
                <option value="tormenta">Tormenta</option>
                <option value="viento">Viento</option>
              </select>
            </div>
            <div style={fieldStyle}>
              <label
                style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--muted)' }}
              >
                Humedad (%)
              </label>
              <input
                type="text"
                value={clima.humedad}
                onChange={(e) => setClima({ ...clima, humedad: e.target.value })}
                style={inputStyle}
                placeholder="Ej: 65"
              />
            </div>
          </div>
        </article>

        <article className="card">
          <div className="panel-header">
            <h2>Descripción General</h2>
          </div>
          <textarea
            value={form.descripcionGeneral}
            onChange={(e) => setForm({ ...form, descripcionGeneral: e.target.value })}
            rows={4}
            style={inputStyle}
          />
        </article>

        <article className="card">
          <div className="panel-header">
            <h2>Actividades Realizadas</h2>
            <button
              type="button"
              className="button"
              onClick={() => setActividades((prev) => [...prev, emptyActividad()])}
            >
              <Plus size={16} /> Agregar
            </button>
          </div>
          {actividades.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>
              No hay actividades registradas.
            </p>
          ) : (
            actividades.map((act, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 80px 40px',
                  gap: 8,
                  marginBottom: 8,
                  alignItems: 'end',
                }}
              >
                <div style={fieldStyle}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 4,
                      fontSize: 12,
                      color: 'var(--muted)',
                    }}
                  >
                    Área
                  </label>
                  <input
                    type="text"
                    value={act.area}
                    onChange={(e) =>
                      setActividades(
                        actividades.map((a, idx) =>
                          idx === i ? { ...a, area: e.target.value } : a
                        )
                      )
                    }
                    style={inputStyle}
                    placeholder="Área"
                  />
                </div>
                <div style={fieldStyle}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 4,
                      fontSize: 12,
                      color: 'var(--muted)',
                    }}
                  >
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={act.descripcion}
                    onChange={(e) =>
                      setActividades(
                        actividades.map((a, idx) =>
                          idx === i ? { ...a, descripcion: e.target.value } : a
                        )
                      )
                    }
                    style={inputStyle}
                    placeholder="Descripción"
                  />
                </div>
                <div style={fieldStyle}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 4,
                      fontSize: 12,
                      color: 'var(--muted)',
                    }}
                  >
                    % Avance
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={act.avance_porcentaje}
                    onChange={(e) =>
                      setActividades(
                        actividades.map((a, idx) =>
                          idx === i ? { ...a, avance_porcentaje: Number(e.target.value) } : a
                        )
                      )
                    }
                    style={inputStyle}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setActividades(actividades.filter((_, idx) => idx !== i))}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-danger)',
                    padding: '0.5rem',
                  }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </article>

        <article className="card">
          <div className="panel-header">
            <h2>Personal</h2>
            <button
              type="button"
              className="button"
              onClick={() => setPersonal((prev) => [...prev, emptyPersonal()])}
            >
              <Plus size={16} /> Agregar
            </button>
          </div>
          {personal.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>
              No hay personal registrado.
            </p>
          ) : (
            personal.map((p, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 100px 100px 40px',
                  gap: 8,
                  marginBottom: 8,
                  alignItems: 'end',
                }}
              >
                <div style={fieldStyle}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 4,
                      fontSize: 12,
                      color: 'var(--muted)',
                    }}
                  >
                    Oficio
                  </label>
                  <input
                    type="text"
                    value={p.oficio}
                    onChange={(e) =>
                      setPersonal(
                        personal.map((per, idx) =>
                          idx === i ? { ...per, oficio: e.target.value } : per
                        )
                      )
                    }
                    style={inputStyle}
                    placeholder="Oficio"
                  />
                </div>
                <div style={fieldStyle}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 4,
                      fontSize: 12,
                      color: 'var(--muted)',
                    }}
                  >
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={p.cantidad}
                    onChange={(e) =>
                      setPersonal(
                        personal.map((per, idx) =>
                          idx === i ? { ...per, cantidad: Number(e.target.value) } : per
                        )
                      )
                    }
                    style={inputStyle}
                  />
                </div>
                <div style={fieldStyle}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 4,
                      fontSize: 12,
                      color: 'var(--muted)',
                    }}
                  >
                    Horas
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={p.horas_trabajadas}
                    onChange={(e) =>
                      setPersonal(
                        personal.map((per, idx) =>
                          idx === i ? { ...per, horas_trabajadas: Number(e.target.value) } : per
                        )
                      )
                    }
                    style={inputStyle}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setPersonal(personal.filter((_, idx) => idx !== i))}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-danger)',
                    padding: '0.5rem',
                  }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </article>

        <article className="card">
          <div className="panel-header">
            <h2>Equipos</h2>
            <button
              type="button"
              className="button"
              onClick={() => setEquipos((prev) => [...prev, emptyEquipo()])}
            >
              <Plus size={16} /> Agregar
            </button>
          </div>
          {equipos.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>
              No hay equipos registrados.
            </p>
          ) : (
            equipos.map((eq, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 100px 100px 40px',
                  gap: 8,
                  marginBottom: 8,
                  alignItems: 'end',
                }}
              >
                <div style={fieldStyle}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 4,
                      fontSize: 12,
                      color: 'var(--muted)',
                    }}
                  >
                    Equipo
                  </label>
                  <input
                    type="text"
                    value={eq.nombre}
                    onChange={(e) =>
                      setEquipos(
                        equipos.map((equ, idx) =>
                          idx === i ? { ...equ, nombre: e.target.value } : equ
                        )
                      )
                    }
                    style={inputStyle}
                    placeholder="Nombre del equipo"
                  />
                </div>
                <div style={fieldStyle}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 4,
                      fontSize: 12,
                      color: 'var(--muted)',
                    }}
                  >
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={eq.cantidad}
                    onChange={(e) =>
                      setEquipos(
                        equipos.map((equ, idx) =>
                          idx === i ? { ...equ, cantidad: Number(e.target.value) } : equ
                        )
                      )
                    }
                    style={inputStyle}
                  />
                </div>
                <div style={fieldStyle}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 4,
                      fontSize: 12,
                      color: 'var(--muted)',
                    }}
                  >
                    Horas
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={eq.horas_operacion}
                    onChange={(e) =>
                      setEquipos(
                        equipos.map((equ, idx) =>
                          idx === i ? { ...equ, horas_operacion: Number(e.target.value) } : equ
                        )
                      )
                    }
                    style={inputStyle}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setEquipos(equipos.filter((_, idx) => idx !== i))}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-danger)',
                    padding: '0.5rem',
                  }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </article>

        <article className="card">
          <div className="panel-header">
            <h2>Materiales Recibidos</h2>
            <button
              type="button"
              className="button"
              onClick={() => setMateriales((prev) => [...prev, emptyMaterial()])}
            >
              <Plus size={16} /> Agregar
            </button>
          </div>
          {materiales.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>
              No hay materiales registrados.
            </p>
          ) : (
            materiales.map((mat, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 100px 80px 1fr 40px',
                  gap: 8,
                  marginBottom: 8,
                  alignItems: 'end',
                }}
              >
                <div style={fieldStyle}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 4,
                      fontSize: 12,
                      color: 'var(--muted)',
                    }}
                  >
                    Material
                  </label>
                  <input
                    type="text"
                    value={mat.nombre}
                    onChange={(e) =>
                      setMateriales(
                        materiales.map((m, idx) =>
                          idx === i ? { ...m, nombre: e.target.value } : m
                        )
                      )
                    }
                    style={inputStyle}
                    placeholder="Nombre"
                  />
                </div>
                <div style={fieldStyle}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 4,
                      fontSize: 12,
                      color: 'var(--muted)',
                    }}
                  >
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={mat.cantidad}
                    onChange={(e) =>
                      setMateriales(
                        materiales.map((m, idx) =>
                          idx === i ? { ...m, cantidad: Number(e.target.value) } : m
                        )
                      )
                    }
                    style={inputStyle}
                  />
                </div>
                <div style={fieldStyle}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 4,
                      fontSize: 12,
                      color: 'var(--muted)',
                    }}
                  >
                    Unidad
                  </label>
                  <select
                    value={mat.unidad}
                    onChange={(e) =>
                      setMateriales(
                        materiales.map((m, idx) =>
                          idx === i ? { ...m, unidad: e.target.value } : m
                        )
                      )
                    }
                    style={inputStyle}
                  >
                    <option value="pza">Pza</option>
                    <option value="kg">Kg</option>
                    <option value="m">M</option>
                    <option value="m2">M²</option>
                    <option value="m3">M³</option>
                    <option value="l">L</option>
                    <option value="ton">Ton</option>
                    <option value="rollo">Rollo</option>
                    <option value="lote">Lote</option>
                  </select>
                </div>
                <div style={fieldStyle}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 4,
                      fontSize: 12,
                      color: 'var(--muted)',
                    }}
                  >
                    Proveedor
                  </label>
                  <input
                    type="text"
                    value={mat.proveedor}
                    onChange={(e) =>
                      setMateriales(
                        materiales.map((m, idx) =>
                          idx === i ? { ...m, proveedor: e.target.value } : m
                        )
                      )
                    }
                    style={inputStyle}
                    placeholder="Proveedor"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setMateriales(materiales.filter((_, idx) => idx !== i))}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-danger)',
                    padding: '0.5rem',
                  }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </article>

        <article className="card">
          <div className="panel-header">
            <h2>Incidentes</h2>
            <button
              type="button"
              className="button"
              onClick={() => setIncidentes((prev) => [...prev, emptyIncidente()])}
            >
              <Plus size={16} /> Agregar
            </button>
          </div>
          {incidentes.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>
              No hay incidentes registrados.
            </p>
          ) : (
            incidentes.map((inc, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '150px 1fr 150px 40px',
                  gap: 8,
                  marginBottom: 8,
                  alignItems: 'end',
                }}
              >
                <div style={fieldStyle}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 4,
                      fontSize: 12,
                      color: 'var(--muted)',
                    }}
                  >
                    Tipo
                  </label>
                  <select
                    value={inc.tipo}
                    onChange={(e) =>
                      setIncidentes(
                        incidentes.map((in2, idx) =>
                          idx === i ? { ...in2, tipo: e.target.value } : in2
                        )
                      )
                    }
                    style={inputStyle}
                  >
                    <option value="">Seleccionar</option>
                    <option value="accidente">Accidente</option>
                    <option value="casi accidente">Casi accidente</option>
                    <option value="daño material">Daño material</option>
                    <option value="ambiental">Ambiental</option>
                    <option value="seguridad">Seguridad</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div style={fieldStyle}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 4,
                      fontSize: 12,
                      color: 'var(--muted)',
                    }}
                  >
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={inc.descripcion}
                    onChange={(e) =>
                      setIncidentes(
                        incidentes.map((in2, idx) =>
                          idx === i ? { ...in2, descripcion: e.target.value } : in2
                        )
                      )
                    }
                    style={inputStyle}
                    placeholder="Descripción"
                  />
                </div>
                <div style={fieldStyle}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 4,
                      fontSize: 12,
                      color: 'var(--muted)',
                    }}
                  >
                    Impacto
                  </label>
                  <select
                    value={inc.impacto}
                    onChange={(e) =>
                      setIncidentes(
                        incidentes.map((in2, idx) =>
                          idx === i ? { ...in2, impacto: e.target.value } : in2
                        )
                      )
                    }
                    style={inputStyle}
                  >
                    <option value="">Seleccionar</option>
                    <option value="bajo">Bajo</option>
                    <option value="medio">Medio</option>
                    <option value="alto">Alto</option>
                    <option value="crítico">Crítico</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setIncidentes(incidentes.filter((_, idx) => idx !== i))}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-danger)',
                    padding: '0.5rem',
                  }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </article>

        <article className="card">
          <div className="panel-header">
            <h2>Seguridad</h2>
          </div>
          <textarea
            value={form.seguridad}
            onChange={(e) => setForm({ ...form, seguridad: e.target.value })}
            rows={3}
            style={inputStyle}
          />
        </article>

        <article className="card">
          <div className="panel-header">
            <h2>Calidad</h2>
          </div>
          <textarea
            value={form.calidad}
            onChange={(e) => setForm({ ...form, calidad: e.target.value })}
            rows={3}
            style={inputStyle}
          />
        </article>

        <article className="card">
          <div className="panel-header">
            <h2>Observaciones</h2>
          </div>
          <textarea
            value={form.observaciones}
            onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
            rows={3}
            style={inputStyle}
          />
        </article>

        <article className="card">
          <div className="panel-header">
            <h2>Fotos</h2>
          </div>
          {fotosExistentes.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 8,
                marginBottom: 12,
              }}
            >
              {fotosExistentes.map((foto) => (
                <div
                  key={foto.id}
                  style={{
                    position: 'relative',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={foto.filePath}
                    alt={foto.descripcion ?? ''}
                    style={{ width: '100%', height: 120, objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeFotoExistente(foto.id)}
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      background: 'rgba(0,0,0,0.6)',
                      border: 'none',
                      borderRadius: 4,
                      color: '#fff',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {fotosPreview.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 8,
                marginBottom: 12,
              }}
            >
              {fotosPreview.map((preview, i) => (
                <div
                  key={i}
                  style={{
                    position: 'relative',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={preview}
                    alt=""
                    style={{ width: '100%', height: 120, objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={() => removeFoto(i)}
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      background: 'rgba(0,0,0,0.6)',
                      border: 'none',
                      borderRadius: 4,
                      color: '#fff',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFiles}
              style={{ fontSize: 13 }}
            />
            <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
              Formatos: JPG, PNG, WEBP
            </p>
          </div>
        </article>

        <div
          style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}
        >
          <Link className="button secondary" href={`/projects/${projectId}/bitacoras`}>
            Cancelar
          </Link>
          <button className="button" type="submit" disabled={saving}>
            {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear entrada'}
          </button>
        </div>
      </form>
    </section>
  );
}
