import { Repository } from 'typeorm';
import { AccessScopeService } from '../../common/access-scope.service';
import { StorageService } from '../../storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DocumentConverterService } from './document-converter.service';
import { ApprovalFlow } from '../approvals/approval-flow.entity';
import { ApprovalRequest } from '../approvals/approval-request.entity';
import { Folder } from '../folders/folder.entity';
import { ProjectMember } from '../projects/project-member.entity';
import { User } from '../users/user.entity';
import { DocumentVersion } from '../versions/document-version.entity';
import { CreateDocumentCommentDto } from './dto/create-document-comment.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CreateDocumentVersionDto } from './dto/create-document-version.dto';
import { DocumentListQueryDto } from './dto/document-list-query.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentAuditLog } from './document-audit-log.entity';
import { DocumentComment } from './document-comment.entity';
import { DocumentMetadata } from './document-metadata.entity';
import { DocumentPermission } from './document-permission.entity';
import { DocumentRecord } from './document.entity';
export declare class DocumentsService {
    private readonly documents;
    private readonly versions;
    private readonly approvalFlows;
    private readonly approvalRequests;
    private readonly metadata;
    private readonly auditLogs;
    private readonly comments;
    private readonly permissions;
    private readonly users;
    private readonly members;
    private readonly folders;
    private readonly scope;
    private readonly storage;
    private readonly notifications;
    private readonly converter;
    private readonly logger;
    constructor(documents: Repository<DocumentRecord>, versions: Repository<DocumentVersion>, approvalFlows: Repository<ApprovalFlow>, approvalRequests: Repository<ApprovalRequest>, metadata: Repository<DocumentMetadata>, auditLogs: Repository<DocumentAuditLog>, comments: Repository<DocumentComment>, permissions: Repository<DocumentPermission>, users: Repository<User>, members: Repository<ProjectMember>, folders: Repository<Folder>, scope: AccessScopeService, storage: StorageService, notifications: NotificationsService, converter: DocumentConverterService);
    listVisible(userId: string, query: DocumentListQueryDto): Promise<{
        id: string;
        name: string;
        documentNumber: string;
        status: "draft" | "in_review" | "approved" | "expired" | "pending_approval" | "published" | "superseded" | "archived";
        confidentialityLevel: "public" | "internal" | "confidential" | "restricted";
        renewable: boolean;
        renewalFrequency: "day" | "week" | "month" | "year" | null | undefined;
        dueDate: string | undefined;
        fileExtension: string | undefined;
        sizeBytes: number | undefined;
        projectId: string;
        folderId: string | undefined;
        disciplineId: string | undefined;
        responsibleUserId: string | undefined;
        currentVersionId: string | undefined;
        updatedAt: Date;
        createdAt: Date;
        project: import("../projects/project.entity").Project;
        folder: Folder | undefined;
        discipline: import("../folders/discipline.entity").Discipline | undefined;
        responsibleUser: User | undefined;
    }[]>;
    create(userId: string, dto: CreateDocumentDto): Promise<{
        project: import("../projects/project.entity").Project;
        folder: Folder | undefined;
        discipline: import("../folders/discipline.entity").Discipline | undefined;
        responsibleUser: User | undefined;
        uploadedBy: User;
        currentVersion: DocumentVersion;
        preview: {
            available: boolean;
            mimeType: string;
            url: string;
        } | {
            available: boolean;
            mimeType: null;
            url: null;
        };
        metadata: DocumentMetadata[];
        versions: DocumentVersion[];
        comments: {
            id: string;
            body: string;
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        audit: DocumentAuditLog[];
        id: string;
        name: string;
        documentNumber: string;
        status: "draft" | "in_review" | "approved" | "expired" | "pending_approval" | "published" | "superseded" | "archived";
        confidentialityLevel: "public" | "internal" | "confidential" | "restricted";
        renewable: boolean;
        renewalFrequency: "day" | "week" | "month" | "year" | null | undefined;
        dueDate: string | undefined;
        fileExtension: string | undefined;
        sizeBytes: number | undefined;
        projectId: string;
        folderId: string | undefined;
        disciplineId: string | undefined;
        responsibleUserId: string | undefined;
        currentVersionId: string | undefined;
        updatedAt: Date;
        createdAt: Date;
    }>;
    getDetail(userId: string, documentId: string, logView?: boolean): Promise<{
        project: import("../projects/project.entity").Project;
        folder: Folder | undefined;
        discipline: import("../folders/discipline.entity").Discipline | undefined;
        responsibleUser: User | undefined;
        uploadedBy: User;
        currentVersion: DocumentVersion;
        preview: {
            available: boolean;
            mimeType: string;
            url: string;
        } | {
            available: boolean;
            mimeType: null;
            url: null;
        };
        metadata: DocumentMetadata[];
        versions: DocumentVersion[];
        comments: {
            id: string;
            body: string;
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        audit: DocumentAuditLog[];
        id: string;
        name: string;
        documentNumber: string;
        status: "draft" | "in_review" | "approved" | "expired" | "pending_approval" | "published" | "superseded" | "archived";
        confidentialityLevel: "public" | "internal" | "confidential" | "restricted";
        renewable: boolean;
        renewalFrequency: "day" | "week" | "month" | "year" | null | undefined;
        dueDate: string | undefined;
        fileExtension: string | undefined;
        sizeBytes: number | undefined;
        projectId: string;
        folderId: string | undefined;
        disciplineId: string | undefined;
        responsibleUserId: string | undefined;
        currentVersionId: string | undefined;
        updatedAt: Date;
        createdAt: Date;
    }>;
    update(userId: string, documentId: string, dto: UpdateDocumentDto): Promise<{
        project: import("../projects/project.entity").Project;
        folder: Folder | undefined;
        discipline: import("../folders/discipline.entity").Discipline | undefined;
        responsibleUser: User | undefined;
        uploadedBy: User;
        currentVersion: DocumentVersion;
        preview: {
            available: boolean;
            mimeType: string;
            url: string;
        } | {
            available: boolean;
            mimeType: null;
            url: null;
        };
        metadata: DocumentMetadata[];
        versions: DocumentVersion[];
        comments: {
            id: string;
            body: string;
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        audit: DocumentAuditLog[];
        id: string;
        name: string;
        documentNumber: string;
        status: "draft" | "in_review" | "approved" | "expired" | "pending_approval" | "published" | "superseded" | "archived";
        confidentialityLevel: "public" | "internal" | "confidential" | "restricted";
        renewable: boolean;
        renewalFrequency: "day" | "week" | "month" | "year" | null | undefined;
        dueDate: string | undefined;
        fileExtension: string | undefined;
        sizeBytes: number | undefined;
        projectId: string;
        folderId: string | undefined;
        disciplineId: string | undefined;
        responsibleUserId: string | undefined;
        currentVersionId: string | undefined;
        updatedAt: Date;
        createdAt: Date;
    }>;
    createVersion(userId: string, documentId: string, dto: CreateDocumentVersionDto): Promise<{
        project: import("../projects/project.entity").Project;
        folder: Folder | undefined;
        discipline: import("../folders/discipline.entity").Discipline | undefined;
        responsibleUser: User | undefined;
        uploadedBy: User;
        currentVersion: DocumentVersion;
        preview: {
            available: boolean;
            mimeType: string;
            url: string;
        } | {
            available: boolean;
            mimeType: null;
            url: null;
        };
        metadata: DocumentMetadata[];
        versions: DocumentVersion[];
        comments: {
            id: string;
            body: string;
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        audit: DocumentAuditLog[];
        id: string;
        name: string;
        documentNumber: string;
        status: "draft" | "in_review" | "approved" | "expired" | "pending_approval" | "published" | "superseded" | "archived";
        confidentialityLevel: "public" | "internal" | "confidential" | "restricted";
        renewable: boolean;
        renewalFrequency: "day" | "week" | "month" | "year" | null | undefined;
        dueDate: string | undefined;
        fileExtension: string | undefined;
        sizeBytes: number | undefined;
        projectId: string;
        folderId: string | undefined;
        disciplineId: string | undefined;
        responsibleUserId: string | undefined;
        currentVersionId: string | undefined;
        updatedAt: Date;
        createdAt: Date;
    }>;
    addComment(userId: string, documentId: string, dto: CreateDocumentCommentDto): Promise<{
        project: import("../projects/project.entity").Project;
        folder: Folder | undefined;
        discipline: import("../folders/discipline.entity").Discipline | undefined;
        responsibleUser: User | undefined;
        uploadedBy: User;
        currentVersion: DocumentVersion;
        preview: {
            available: boolean;
            mimeType: string;
            url: string;
        } | {
            available: boolean;
            mimeType: null;
            url: null;
        };
        metadata: DocumentMetadata[];
        versions: DocumentVersion[];
        comments: {
            id: string;
            body: string;
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        audit: DocumentAuditLog[];
        id: string;
        name: string;
        documentNumber: string;
        status: "draft" | "in_review" | "approved" | "expired" | "pending_approval" | "published" | "superseded" | "archived";
        confidentialityLevel: "public" | "internal" | "confidential" | "restricted";
        renewable: boolean;
        renewalFrequency: "day" | "week" | "month" | "year" | null | undefined;
        dueDate: string | undefined;
        fileExtension: string | undefined;
        sizeBytes: number | undefined;
        projectId: string;
        folderId: string | undefined;
        disciplineId: string | undefined;
        responsibleUserId: string | undefined;
        currentVersionId: string | undefined;
        updatedAt: Date;
        createdAt: Date;
    }>;
    requestApproval(userId: string, documentId: string): Promise<{
        project: import("../projects/project.entity").Project;
        folder: Folder | undefined;
        discipline: import("../folders/discipline.entity").Discipline | undefined;
        responsibleUser: User | undefined;
        uploadedBy: User;
        currentVersion: DocumentVersion;
        preview: {
            available: boolean;
            mimeType: string;
            url: string;
        } | {
            available: boolean;
            mimeType: null;
            url: null;
        };
        metadata: DocumentMetadata[];
        versions: DocumentVersion[];
        comments: {
            id: string;
            body: string;
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        audit: DocumentAuditLog[];
        id: string;
        name: string;
        documentNumber: string;
        status: "draft" | "in_review" | "approved" | "expired" | "pending_approval" | "published" | "superseded" | "archived";
        confidentialityLevel: "public" | "internal" | "confidential" | "restricted";
        renewable: boolean;
        renewalFrequency: "day" | "week" | "month" | "year" | null | undefined;
        dueDate: string | undefined;
        fileExtension: string | undefined;
        sizeBytes: number | undefined;
        projectId: string;
        folderId: string | undefined;
        disciplineId: string | undefined;
        responsibleUserId: string | undefined;
        currentVersionId: string | undefined;
        updatedAt: Date;
        createdAt: Date;
    }>;
    approve(userId: string, documentId: string): Promise<{
        project: import("../projects/project.entity").Project;
        folder: Folder | undefined;
        discipline: import("../folders/discipline.entity").Discipline | undefined;
        responsibleUser: User | undefined;
        uploadedBy: User;
        currentVersion: DocumentVersion;
        preview: {
            available: boolean;
            mimeType: string;
            url: string;
        } | {
            available: boolean;
            mimeType: null;
            url: null;
        };
        metadata: DocumentMetadata[];
        versions: DocumentVersion[];
        comments: {
            id: string;
            body: string;
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        audit: DocumentAuditLog[];
        id: string;
        name: string;
        documentNumber: string;
        status: "draft" | "in_review" | "approved" | "expired" | "pending_approval" | "published" | "superseded" | "archived";
        confidentialityLevel: "public" | "internal" | "confidential" | "restricted";
        renewable: boolean;
        renewalFrequency: "day" | "week" | "month" | "year" | null | undefined;
        dueDate: string | undefined;
        fileExtension: string | undefined;
        sizeBytes: number | undefined;
        projectId: string;
        folderId: string | undefined;
        disciplineId: string | undefined;
        responsibleUserId: string | undefined;
        currentVersionId: string | undefined;
        updatedAt: Date;
        createdAt: Date;
    }>;
    reject(userId: string, documentId: string): Promise<{
        project: import("../projects/project.entity").Project;
        folder: Folder | undefined;
        discipline: import("../folders/discipline.entity").Discipline | undefined;
        responsibleUser: User | undefined;
        uploadedBy: User;
        currentVersion: DocumentVersion;
        preview: {
            available: boolean;
            mimeType: string;
            url: string;
        } | {
            available: boolean;
            mimeType: null;
            url: null;
        };
        metadata: DocumentMetadata[];
        versions: DocumentVersion[];
        comments: {
            id: string;
            body: string;
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        audit: DocumentAuditLog[];
        id: string;
        name: string;
        documentNumber: string;
        status: "draft" | "in_review" | "approved" | "expired" | "pending_approval" | "published" | "superseded" | "archived";
        confidentialityLevel: "public" | "internal" | "confidential" | "restricted";
        renewable: boolean;
        renewalFrequency: "day" | "week" | "month" | "year" | null | undefined;
        dueDate: string | undefined;
        fileExtension: string | undefined;
        sizeBytes: number | undefined;
        projectId: string;
        folderId: string | undefined;
        disciplineId: string | undefined;
        responsibleUserId: string | undefined;
        currentVersionId: string | undefined;
        updatedAt: Date;
        createdAt: Date;
    }>;
    getCurrentContent(userId: string, documentId: string): Promise<{
        buffer: NonSharedBuffer;
        fileName: string;
        mimeType: string;
        documentId: string;
    }>;
    getCurrentContentAsHtml(userId: string, documentId: string): Promise<{
        buffer: NonSharedBuffer;
        fileName: string;
        mimeType: string;
        documentId: string;
    }>;
    download(userId: string, documentId: string): Promise<{
        buffer: NonSharedBuffer;
        fileName: string;
        mimeType: string;
        documentId: string;
    }>;
    print(userId: string, documentId: string): Promise<{
        ok: boolean;
        documentId: string;
        action: string;
    }>;
    assertDocumentAccess(userId: string, documentId: string): Promise<DocumentRecord>;
    private canAccessDocument;
    private filterDocumentsByPermissions;
    private storeBase64File;
    private resolveProjectFolder;
    private readCurrentVersion;
    private getExtension;
    private optionalValue;
    private handleDocumentMutationError;
    private canPublish;
    private toListItem;
    private log;
    private notifyDocumentVersion;
    private notifyDocumentDecision;
}
