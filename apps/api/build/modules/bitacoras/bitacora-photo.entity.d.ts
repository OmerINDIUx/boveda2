import { BitacoraEntry } from './bitacora-entry.entity';
export declare class BitacoraPhoto {
    id: string;
    entryId: string;
    entry: BitacoraEntry;
    filePath: string;
    descripcion?: string;
    tipo: string;
    createdAt: Date;
}
