import { Repository } from 'typeorm';
import { AccessScopeService } from '../../common/access-scope.service';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { StorageService } from '../../storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Project } from '../projects/project.entity';
import { User } from '../users/user.entity';
import { Bitacora } from './bitacora.entity';
import { BitacoraEntry } from './bitacora-entry.entity';
import { BitacoraPhoto } from './bitacora-photo.entity';
import { BitacoraHistory } from './bitacora-history.entity';
import { CreateBitacoraEntryDto, PhotoInputDto } from './dto/create-bitacora-entry.dto';
import { UpdateBitacoraEntryDto } from './dto/update-bitacora-entry.dto';
import { BitacoraListQueryDto } from './dto/bitacora-list-query.dto';
import { SignBitacoraEntryDto } from './dto/sign-bitacora-entry.dto';
export declare class BitacorasService {
    private readonly bitacoras;
    private readonly entries;
    private readonly photos;
    private readonly history;
    private readonly projects;
    private readonly users;
    private readonly scope;
    private readonly storage;
    private readonly notifications;
    private readonly logger;
    constructor(bitacoras: Repository<Bitacora>, entries: Repository<BitacoraEntry>, photos: Repository<BitacoraPhoto>, history: Repository<BitacoraHistory>, projects: Repository<Project>, users: Repository<User>, scope: AccessScopeService, storage: StorageService, notifications: NotificationsService);
    getOrCreateBitacora(projectId: string): Promise<Bitacora>;
    listEntries(user: RequestUser, query: BitacoraListQueryDto): Promise<{
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
    getDetail(user: RequestUser, entryId: string): Promise<{
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
    update(user: RequestUser, entryId: string, dto: UpdateBitacoraEntryDto): Promise<{
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
    sign(user: RequestUser, entryId: string, dto: SignBitacoraEntryDto): Promise<{
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
    delete(user: RequestUser, entryId: string): Promise<{
        ok: boolean;
    }>;
    uploadPhoto(user: RequestUser, entryId: string, file: PhotoInputDto): Promise<BitacoraPhoto>;
    deletePhoto(user: RequestUser, entryId: string, photoId: string): Promise<{
        ok: boolean;
    }>;
    getReport(user: RequestUser, projectId: string, tipo: 'semanal' | 'mensual', fecha: string): Promise<{
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
    exportPdf(user: RequestUser, entryId: string): Promise<{
        html: string;
        filename: string;
    }>;
    private buildPdfHtml;
    getFormOptions(user: RequestUser, projectId?: string): Promise<{
        projects: {
            id: string;
            name: string;
            code: string;
        }[];
    }>;
    private assertAccess;
    private assertEntryAccess;
    private resolveVisibleProjectIds;
    private createPhotos;
    private logHistory;
    private snapshot;
    private serializeListItem;
    private serializeDetail;
}
