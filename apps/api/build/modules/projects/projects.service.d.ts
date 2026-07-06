import { Repository } from 'typeorm';
import { AccessScopeService } from '../../common/access-scope.service';
import { AuditService } from '../audit/audit.service';
import { DocumentRecord } from '../documents/document.entity';
import { Discipline } from '../folders/discipline.entity';
import { Folder } from '../folders/folder.entity';
import { User } from '../users/user.entity';
import { AssignProjectUserDto } from './dto/assign-project-user.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectDocumentsQueryDto } from './dto/project-documents-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectMember } from './project-member.entity';
import { Project } from './project.entity';
type FolderNode = Folder & {
  children: FolderNode[];
};
export declare class ProjectsService {
  private readonly projects;
  private readonly members;
  private readonly users;
  private readonly disciplines;
  private readonly folders;
  private readonly documents;
  private readonly scope;
  private readonly audit;
  constructor(
    projects: Repository<Project>,
    members: Repository<ProjectMember>,
    users: Repository<User>,
    disciplines: Repository<Discipline>,
    folders: Repository<Folder>,
    documents: Repository<DocumentRecord>,
    scope: AccessScopeService,
    audit: AuditService
  );
  listForUser(userId: string): Promise<
    {
      id: string;
      name: string;
      code: string;
      description: string | undefined;
      workType: string | undefined;
      currentStage: string | undefined;
      priority: 'media' | 'baja' | 'alta' | 'critica';
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
        role: 'viewer' | 'owner' | 'manager' | 'contributor';
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
    }[]
  >;
  getDetail(
    userId: string,
    projectId: string
  ): Promise<{
    project: {
      id: string;
      name: string;
      code: string;
      description: string | undefined;
      workType: string | undefined;
      currentStage: string | undefined;
      priority: 'media' | 'baja' | 'alta' | 'critica';
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
        role: 'viewer' | 'owner' | 'manager' | 'contributor';
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
    folders: FolderNode[];
    recentDocuments: DocumentRecord[];
    criticalDocuments: DocumentRecord[];
    documentsSummary: {
      total: number;
      approved: number;
      inReview: number;
      overdue: number;
      critical: number;
    };
    availableDisciplines: Discipline[];
  }>;
  getProjectDocuments(
    userId: string,
    projectId: string,
    filters: ProjectDocumentsQueryDto
  ): Promise<{
    items: DocumentRecord[];
    summary: {
      total: number;
      approved: number;
      inReview: number;
      overdue: number;
      critical: number;
    };
    recent: DocumentRecord[];
    critical: DocumentRecord[];
  }>;
  create(
    dto: CreateProjectDto,
    ownerId: string
  ): Promise<{
    project: {
      id: string;
      name: string;
      code: string;
      description: string | undefined;
      workType: string | undefined;
      currentStage: string | undefined;
      priority: 'media' | 'baja' | 'alta' | 'critica';
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
        role: 'viewer' | 'owner' | 'manager' | 'contributor';
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
    folders: FolderNode[];
    recentDocuments: DocumentRecord[];
    criticalDocuments: DocumentRecord[];
    documentsSummary: {
      total: number;
      approved: number;
      inReview: number;
      overdue: number;
      critical: number;
    };
    availableDisciplines: Discipline[];
  }>;
  update(
    requesterId: string,
    projectId: string,
    dto: UpdateProjectDto
  ): Promise<{
    project: {
      id: string;
      name: string;
      code: string;
      description: string | undefined;
      workType: string | undefined;
      currentStage: string | undefined;
      priority: 'media' | 'baja' | 'alta' | 'critica';
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
        role: 'viewer' | 'owner' | 'manager' | 'contributor';
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
    folders: FolderNode[];
    recentDocuments: DocumentRecord[];
    criticalDocuments: DocumentRecord[];
    documentsSummary: {
      total: number;
      approved: number;
      inReview: number;
      overdue: number;
      critical: number;
    };
    availableDisciplines: Discipline[];
  }>;
  deactivate(
    requesterId: string,
    projectId: string
  ): Promise<{
    ok: boolean;
    projectId: string;
    isActive: boolean;
  }>;
  assignUser(
    requesterId: string,
    projectId: string,
    dto: AssignProjectUserDto
  ): Promise<ProjectMember>;
  listMembers(userId: string, projectId: string): Promise<ProjectMember[]>;
  assertAccess(userId: string, projectId: string): Promise<void>;
  private syncAssignedUsers;
  private ensureProjectFolderStructure;
  private queryProjectDocuments;
  private toProjectSummary;
  private buildFolderTree;
  private getRecentDocuments;
  private getCriticalDocuments;
  private buildDocumentsSummary;
  private isCriticalDocument;
  private isOverdue;
  private isDueSoon;
}
export {};
