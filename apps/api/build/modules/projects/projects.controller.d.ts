import { RequestUser } from '../../common/interfaces/request-user.interface';
import { AssignProjectUserDto } from './dto/assign-project-user.dto';
import { CheckCatalogSynonymsDto } from './dto/check-catalog-synonyms.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { SearchCatalogSynonymsDto } from './dto/search-catalog-synonyms.dto';
import { CreateProjectCatalogOptionDto } from './dto/create-project-catalog-option.dto';
import { ProjectDocumentsQueryDto } from './dto/project-documents-query.dto';
import { UpdateProjectCatalogOptionDto } from './dto/update-project-catalog-option.dto';
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
        priority: "baja" | "media" | "alta" | "critica";
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
            role: "owner" | "manager" | "contributor" | "viewer";
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
    formOptions(user: RequestUser): Promise<{
        users: {
            id: string;
            name: string;
            email: string;
        }[];
        disciplines: {
            id: string;
            code: string;
            name: string;
            description: string | undefined;
        }[];
        catalogs: Record<"status" | "workType" | "currentStage" | "priority", import("./project-catalog-option.entity").ProjectCatalogOption[]>;
    }>;
    catalogOptions(): Promise<import("./project-catalog-option.entity").ProjectCatalogOption[]>;
    createCatalogOption(dto: CreateProjectCatalogOptionDto, user: RequestUser): Promise<import("./project-catalog-option.entity").ProjectCatalogOption>;
    checkSynonyms(dto: CheckCatalogSynonymsDto): Promise<{
        synonym: string | null;
    }>;
    searchSynonyms(dto: SearchCatalogSynonymsDto): Promise<{
        ids: string[];
    }>;
    updateCatalogOption(id: string, dto: UpdateProjectCatalogOptionDto, user: RequestUser): Promise<import("./project-catalog-option.entity").ProjectCatalogOption>;
    deactivateCatalogOption(id: string, user: RequestUser): Promise<{
        ok: boolean;
        id: string;
    }>;
    create(dto: CreateProjectDto, user: RequestUser): Promise<{
        project: {
            id: string;
            name: string;
            code: string;
            description: string | undefined;
            workType: string | undefined;
            currentStage: string | undefined;
            priority: "baja" | "media" | "alta" | "critica";
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
                role: "owner" | "manager" | "contributor" | "viewer";
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
    listDrafts(user: RequestUser): Promise<import("./project.entity").Project[]>;
    publishDraft(id: string, user: RequestUser): Promise<{
        project: {
            id: string;
            name: string;
            code: string;
            description: string | undefined;
            workType: string | undefined;
            currentStage: string | undefined;
            priority: "baja" | "media" | "alta" | "critica";
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
                role: "owner" | "manager" | "contributor" | "viewer";
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
            priority: "baja" | "media" | "alta" | "critica";
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
                role: "owner" | "manager" | "contributor" | "viewer";
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
            priority: "baja" | "media" | "alta" | "critica";
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
                role: "owner" | "manager" | "contributor" | "viewer";
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
