export type Clima = { temperatura: string; condicion: string; humedad: string };
export type Actividad = { area: string; descripcion: string; avance_porcentaje: number };
export type Personal = { oficio: string; cantidad: number; horas_trabajadas: number };
export type Equipo = { nombre: string; cantidad: number; horas_operacion: number };
export type Material = { nombre: string; cantidad: number; unidad: string; proveedor: string };
export type Incidente = { tipo: string; descripcion: string; impacto: string };
export type PhotoInput = {
  fileName: string;
  mimeType: string;
  base64Content: string;
  descripcion?: string;
  tipo?: string;
};

export const emptyActividad = (): Actividad => ({
  area: '',
  descripcion: '',
  avance_porcentaje: 0,
});
export const emptyPersonal = (): Personal => ({ oficio: '', cantidad: 1, horas_trabajadas: 1 });
export const emptyEquipo = (): Equipo => ({ nombre: '', cantidad: 1, horas_operacion: 1 });
export const emptyMaterial = (): Material => ({
  nombre: '',
  cantidad: 1,
  unidad: 'pza',
  proveedor: '',
});
export const emptyIncidente = (): Incidente => ({ tipo: '', descripcion: '', impacto: '' });

export type BitacoraEntry = {
  id: string;
  bitacoraId: string;
  projectId: string;
  folio: number;
  fecha: string;
  turno: string;
  estado: string;
  descripcionGeneral?: string;
  avanceEstimado?: number | null;
  createdBy: { id: string; name: string } | null;
  firmadoPor: { id: string; name: string } | null;
  firmadoEn: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BitacoraDetail = BitacoraEntry & {
  clima?: Record<string, unknown>;
  actividades?: Record<string, unknown>;
  personal?: Record<string, unknown>;
  equipos?: Record<string, unknown>;
  materialesRecibidos?: Record<string, unknown>;
  incidentes?: Record<string, unknown>;
  seguridad?: string;
  calidad?: string;
  observaciones?: string;
  avanceEstimado?: number | null;
  fotos: Array<{
    id: string;
    filePath: string;
    descripcion?: string;
    tipo: string;
    createdAt: string;
  }>;
  history: Array<{
    id: string;
    accion: string;
    beforeState?: unknown;
    afterState?: unknown;
    createdAt: string;
    actor: { id: string; name: string } | null;
  }>;
};

export function getToken() {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem('holocron_token') ?? undefined;
}

export function getEstadoTone(estado: string) {
  switch (estado) {
    case 'borrador':
      return 'warning';
    case 'firmado':
      return 'success';
    case 'cerrado':
      return '';
    default:
      return '';
  }
}
