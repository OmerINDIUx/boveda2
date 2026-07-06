import { Project } from '../projects/project.entity';
import { User } from '../users/user.entity';
export declare class DocumentQueryHistory {
    id: string;
    userId: string;
    user: User;
    projectId?: string;
    project?: Project;
    documentId?: string;
    question: string;
    answer: string;
    status: 'answered' | 'insufficient_information' | 'error';
    citationsJson?: Array<Record<string, unknown>>;
    responseJson?: Record<string, unknown>;
    createdAt: Date;
}
