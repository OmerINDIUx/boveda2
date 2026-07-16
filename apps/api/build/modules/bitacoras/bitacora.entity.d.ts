import { Project } from '../projects/project.entity';
import { BitacoraEntry } from './bitacora-entry.entity';
export declare class Bitacora {
    id: string;
    projectId: string;
    project: Project;
    folioActual: number;
    entries: BitacoraEntry[];
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
