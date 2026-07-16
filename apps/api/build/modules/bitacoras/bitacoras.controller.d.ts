import { RequestUser } from '../../common/interfaces/request-user.interface';
import { BitacorasService } from './bitacoras.service';
import { CreateBitacoraEntryDto, PhotoInputDto } from './dto/create-bitacora-entry.dto';
import { UpdateBitacoraEntryDto } from './dto/update-bitacora-entry.dto';
import { BitacoraListQueryDto } from './dto/bitacora-list-query.dto';
import { SignBitacoraEntryDto } from './dto/sign-bitacora-entry.dto';
export declare class BitacorasController {
    private readonly bitacoras;
    constructor(bitacoras: BitacorasService);
    list(user: RequestUser, query: BitacoraListQueryDto): Promise<{
        id: string;
        bitacoraId: string;
        projectId: string;
        folio: number;
        fecha: string;
        turno: string;
        estado: string;
        descripcionGeneral: string | undefined;
        avanceEstimado: number | null;
        createdBy: {
            id: string;
            name: string;
        } | null;
        firmadoPor: {
            id: string;
            name: string;
        } | null;
        firmadoEn: Date | undefined;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    formOptions(user: RequestUser, projectId?: string): Promise<{
        projects: {
            id: string;
            name: string;
            code: string;
        }[];
    }>;
    report(user: RequestUser, projectId: string, tipo: 'semanal' | 'mensual', fecha: string): Promise<{
        tipo: "semanal" | "mensual";
        desde: string;
        hasta: string;
        totalEntradas: number;
        entradasFirmadas: number;
        avancePromedio: number;
        totalIncidentes: number;
        incidentes: Record<string, unknown>[];
        entries: {
            id: string;
            bitacoraId: string;
            projectId: string;
            folio: number;
            fecha: string;
            turno: string;
            estado: string;
            descripcionGeneral: string | undefined;
            avanceEstimado: number | null;
            createdBy: {
                id: string;
                name: string;
            } | null;
            firmadoPor: {
                id: string;
                name: string;
            } | null;
            firmadoEn: Date | undefined;
            createdAt: Date;
            updatedAt: Date;
        }[];
    }>;
    detail(user: RequestUser, id: string): Promise<{
        clima: Record<string, unknown> | undefined;
        descripcionGeneral: string | undefined;
        actividades: Record<string, unknown> | undefined;
        personal: Record<string, unknown> | undefined;
        equipos: Record<string, unknown> | undefined;
        materialesRecibidos: Record<string, unknown> | undefined;
        incidentes: Record<string, unknown> | undefined;
        seguridad: string | undefined;
        calidad: string | undefined;
        observaciones: string | undefined;
        avanceEstimado: number | null;
        fotos: {
            id: string;
            filePath: string;
            descripcion: string | undefined;
            tipo: string;
            createdAt: Date;
        }[];
        history: {
            id: string;
            accion: string;
            beforeState: Record<string, unknown> | undefined;
            afterState: Record<string, unknown> | undefined;
            createdAt: Date;
            actor: {
                id: string;
                name: string;
            } | null;
        }[];
        id: string;
        bitacoraId: string;
        projectId: string;
        folio: number;
        fecha: string;
        turno: string;
        estado: string;
        createdBy: {
            id: string;
            name: string;
        } | null;
        firmadoPor: {
            id: string;
            name: string;
        } | null;
        firmadoEn: Date | undefined;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(user: RequestUser, dto: CreateBitacoraEntryDto): Promise<{
        clima: Record<string, unknown> | undefined;
        descripcionGeneral: string | undefined;
        actividades: Record<string, unknown> | undefined;
        personal: Record<string, unknown> | undefined;
        equipos: Record<string, unknown> | undefined;
        materialesRecibidos: Record<string, unknown> | undefined;
        incidentes: Record<string, unknown> | undefined;
        seguridad: string | undefined;
        calidad: string | undefined;
        observaciones: string | undefined;
        avanceEstimado: number | null;
        fotos: {
            id: string;
            filePath: string;
            descripcion: string | undefined;
            tipo: string;
            createdAt: Date;
        }[];
        history: {
            id: string;
            accion: string;
            beforeState: Record<string, unknown> | undefined;
            afterState: Record<string, unknown> | undefined;
            createdAt: Date;
            actor: {
                id: string;
                name: string;
            } | null;
        }[];
        id: string;
        bitacoraId: string;
        projectId: string;
        folio: number;
        fecha: string;
        turno: string;
        estado: string;
        createdBy: {
            id: string;
            name: string;
        } | null;
        firmadoPor: {
            id: string;
            name: string;
        } | null;
        firmadoEn: Date | undefined;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(user: RequestUser, id: string, dto: UpdateBitacoraEntryDto): Promise<{
        clima: Record<string, unknown> | undefined;
        descripcionGeneral: string | undefined;
        actividades: Record<string, unknown> | undefined;
        personal: Record<string, unknown> | undefined;
        equipos: Record<string, unknown> | undefined;
        materialesRecibidos: Record<string, unknown> | undefined;
        incidentes: Record<string, unknown> | undefined;
        seguridad: string | undefined;
        calidad: string | undefined;
        observaciones: string | undefined;
        avanceEstimado: number | null;
        fotos: {
            id: string;
            filePath: string;
            descripcion: string | undefined;
            tipo: string;
            createdAt: Date;
        }[];
        history: {
            id: string;
            accion: string;
            beforeState: Record<string, unknown> | undefined;
            afterState: Record<string, unknown> | undefined;
            createdAt: Date;
            actor: {
                id: string;
                name: string;
            } | null;
        }[];
        id: string;
        bitacoraId: string;
        projectId: string;
        folio: number;
        fecha: string;
        turno: string;
        estado: string;
        createdBy: {
            id: string;
            name: string;
        } | null;
        firmadoPor: {
            id: string;
            name: string;
        } | null;
        firmadoEn: Date | undefined;
        createdAt: Date;
        updatedAt: Date;
    }>;
    sign(user: RequestUser, id: string, dto: SignBitacoraEntryDto): Promise<{
        clima: Record<string, unknown> | undefined;
        descripcionGeneral: string | undefined;
        actividades: Record<string, unknown> | undefined;
        personal: Record<string, unknown> | undefined;
        equipos: Record<string, unknown> | undefined;
        materialesRecibidos: Record<string, unknown> | undefined;
        incidentes: Record<string, unknown> | undefined;
        seguridad: string | undefined;
        calidad: string | undefined;
        observaciones: string | undefined;
        avanceEstimado: number | null;
        fotos: {
            id: string;
            filePath: string;
            descripcion: string | undefined;
            tipo: string;
            createdAt: Date;
        }[];
        history: {
            id: string;
            accion: string;
            beforeState: Record<string, unknown> | undefined;
            afterState: Record<string, unknown> | undefined;
            createdAt: Date;
            actor: {
                id: string;
                name: string;
            } | null;
        }[];
        id: string;
        bitacoraId: string;
        projectId: string;
        folio: number;
        fecha: string;
        turno: string;
        estado: string;
        createdBy: {
            id: string;
            name: string;
        } | null;
        firmadoPor: {
            id: string;
            name: string;
        } | null;
        firmadoEn: Date | undefined;
        createdAt: Date;
        updatedAt: Date;
    }>;
    delete(user: RequestUser, id: string): Promise<{
        ok: boolean;
    }>;
    uploadPhoto(user: RequestUser, id: string, body: PhotoInputDto): Promise<import("./bitacora-photo.entity").BitacoraPhoto>;
    deletePhoto(user: RequestUser, id: string, photoId: string): Promise<{
        ok: boolean;
    }>;
    exportPdf(user: RequestUser, id: string): Promise<{
        html: string;
        filename: string;
    }>;
}
