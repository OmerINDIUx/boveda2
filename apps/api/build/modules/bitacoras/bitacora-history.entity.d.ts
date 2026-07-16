import { User } from '../users/user.entity';
import { BitacoraEntry } from './bitacora-entry.entity';
export declare class BitacoraHistory {
    id: string;
    entryId: string;
    entry: BitacoraEntry;
    actorId?: string;
    actor?: User;
    accion: string;
    beforeState?: Record<string, unknown>;
    afterState?: Record<string, unknown>;
    createdAt: Date;
}
