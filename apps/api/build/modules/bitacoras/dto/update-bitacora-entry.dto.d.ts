import { PhotoInputDto } from './create-bitacora-entry.dto';
export declare class UpdateBitacoraEntryDto {
    fecha?: string;
    turno?: string;
    clima?: Record<string, unknown>;
    descripcionGeneral?: string;
    actividades?: Record<string, unknown>;
    personal?: Record<string, unknown>;
    equipos?: Record<string, unknown>;
    materialesRecibidos?: Record<string, unknown>;
    incidentes?: Record<string, unknown>;
    seguridad?: string;
    calidad?: string;
    observaciones?: string;
    avanceEstimado?: number;
    fotos?: PhotoInputDto[];
}
