import { RequestUser } from '../../common/interfaces/request-user.interface';
import { AssignProjectUserDto } from './dto/assign-project-user.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectDocumentsQueryDto } from './dto/project-documents-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';
export declare class ProjectsController {
    private readonly projects;
    constructor(projects: ProjectsService);
    list(user: RequestUser): Promise<{
        id: string;
        name: string;
        code: string;
        description: string | undefined;
        workType: string | undefined;
        currentStage: string | undefined;
        priority: "media" | "baja" | "alta" | "critica";
        targetDate: string | undefined;
        status: string;
        isActive: boolean;
        responsible: {
            id: string;
            name: string;
            email: string;
        } | null;
        assignedUsers: {
            id: string;
            name: string;
            email: string;
            role: "viewer" | "owner" | "manager" | "contributor";
        }[];
        disciplines: {
            id: string;
            code: string;
            name: string;
        }[];
        metrics: {
            documents: number;
            approved: number;
            critical: number;
            progress: number;
        };
        updatedAt: Date;
        createdAt: Date;
    }[]>;
    create(dto: CreateProjectDto, user: RequestUser): Promise<{
        project: {
            id: string;
            name: string;
            code: string;
            description: string | undefined;
            workType: string | undefined;
            currentStage: string | undefined;
            priority: "media" | "baja" | "alta" | "critica";
            targetDate: string | undefined;
            status: string;
            isActive: boolean;
            responsible: {
                id: string;
                name: string;
                email: string;
            } | null;
            assignedUsers: {
                id: string;
                name: string;
                email: string;
                role: "viewer" | "owner" | "manager" | "contributor";
            }[];
            disciplines: {
                id: string;
                code: string;
                name: string;
            }[];
            metrics: {
                documents: number;
                approved: number;
                critical: number;
                progress: number;
            };
            updatedAt: Date;
            createdAt: Date;
        };
        folders: (import("../folders/folder.entity").Folder & {
            children: (import("../folders/folder.entity").Folder & any)[];
        })[];
        recentDocuments: import("../documents/document.entity").DocumentRecord[];
        criticalDocuments: import("../documents/document.entity").DocumentRecord[];
        documentsSummary: {
            total: number;
            approved: number;
            inReview: number;
            overdue: number;
            critical: number;
        };
        availableDisciplines: import("../folders/discipline.entity").Discipline[];
    }>;
    detail(id: string, user: RequestUser): Promise<{
        project: {
            id: string;
            name: string;
            code: string;
            description: string | undefined;
            workType: string | undefined;
            currentStage: string | undefined;
            priority: "media" | "baja" | "alta" | "critica";
            targetDate: string | undefined;
            status: string;
            isActive: boolean;
            responsible: {
                id: string;
                name: string;
                email: string;
            } | null;
            assignedUsers: {
                id: string;
                name: string;
                email: string;
                role: "viewer" | "owner" | "manager" | "contributor";
            }[];
            disciplines: {
                id: string;
                code: string;
                name: string;
            }[];
            metrics: {
                documents: number;
                approved: number;
                critical: number;
                progress: number;
            };
            updatedAt: Date;
            createdAt: Date;
        };
        folders: (import("../folders/folder.entity").Folder & {
            children: (import("../folders/folder.entity").Folder & any)[];
        })[];
        recentDocuments: import("../documents/document.entity").DocumentRecord[];
        criticalDocuments: import("../documents/document.entity").DocumentRecord[];
        documentsSummary: {
            total: number;
            approved: number;
            inReview: number;
            overdue: number;
            critical: number;
        };
        availableDisciplines: import("../folders/discipline.entity").Discipline[];
    }>;
    documents(id: string, query: ProjectDocumentsQueryDto, user: RequestUser): Promise<{
        items: import("../documents/document.entity").DocumentRecord[];
        summary: {
            total: number;
            approved: number;
            inReview: number;
            overdue: number;
            critical: number;
        };
        recent: import("../documents/document.entity").DocumentRecord[];
        critical: import("../documents/document.entity").DocumentRecord[];
    }>;
    update(id: string, dto: UpdateProjectDto, user: RequestUser): Promise<{
        project: {
            id: string;
            name: string;
            code: string;
            description: string | undefined;
            workType: string | undefined;
            currentStage: string | undefined;
            priority: "media" | "baja" | "alta" | "critica";
            targetDate: string | undefined;
            status: string;
            isActive: boolean;
            responsible: {
                id: string;
                name: string;
                email: string;
            } | null;
            assignedUsers: {
                id: string;
                name: string;
                email: string;
                role: "viewer" | "owner" | "manager" | "contributor";
            }[];
            disciplines: {
                id: string;
                code: string;
                name: string;
            }[];
            metrics: {
                documents: number;
                approved: number;
                critical: number;
                progress: number;
            };
            updatedAt: Date;
            createdAt: Date;
        };
        folders: (import("../folders/folder.entity").Folder & {
            children: (import("../folders/folder.entity").Folder & any)[];
        })[];
        recentDocuments: import("../documents/document.entity").DocumentRecord[];
        criticalDocuments: import("../documents/document.entity").DocumentRecord[];
        documentsSummary: {
            total: number;
            approved: number;
            inReview: number;
            overdue: number;
            critical: number;
        };
        availableDisciplines: import("../folders/discipline.entity").Discipline[];
    }>;
    deactivate(id: string, user: RequestUser): Promise<{
        ok: boolean;
        projectId: string;
        isActive: boolean;
    }>;
    listMembers(id: string, user: RequestUser): Promise<import("./project-member.entity").ProjectMember[]>;
    assignUser(id: string, dto: AssignProjectUserDto, user: RequestUser): Promise<import("./project-member.entity").ProjectMember>;
}
