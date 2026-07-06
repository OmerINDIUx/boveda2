import { User } from '../users/user.entity';
import { Discipline } from './discipline.entity';
export declare class Folder {
    id: string;
    projectId: string;
    parentId?: string;
    parent?: Folder;
    disciplineId?: string;
    discipline?: Discipline;
    name: string;
    path?: string;
    createdById?: string;
    createdBy?: User;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
