import type { Response } from 'express';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { CreateDocumentCommentDto } from './dto/create-document-comment.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CreateDocumentVersionDto } from './dto/create-document-version.dto';
import { DocumentListQueryDto } from './dto/document-list-query.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentsService } from './documents.service';
export declare class DocumentsController {
    private readonly documents;
    constructor(documents: DocumentsService);
    list(user: RequestUser, query: DocumentListQueryDto): Promise<{
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
        folder: import("../folders/folder.entity").Folder | undefined;
        discipline: import("../folders/discipline.entity").Discipline | undefined;
        responsibleUser: import("../users/user.entity").User | undefined;
    }[]>;
    create(user: RequestUser, dto: CreateDocumentDto): Promise<{
        project: import("../projects/project.entity").Project;
        folder: import("../folders/folder.entity").Folder | undefined;
        discipline: import("../folders/discipline.entity").Discipline | undefined;
        responsibleUser: import("../users/user.entity").User | undefined;
        uploadedBy: import("../users/user.entity").User;
        currentVersion: import("../versions/document-version.entity").DocumentVersion;
        preview: {
            available: boolean;
            mimeType: string;
            url: string;
        } | {
            available: boolean;
            mimeType: null;
            url: null;
        };
        metadata: import("./document-metadata.entity").DocumentMetadata[];
        versions: import("../versions/document-version.entity").DocumentVersion[];
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
        audit: import("./document-audit-log.entity").DocumentAuditLog[];
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
    detail(id: string, user: RequestUser): Promise<{
        project: import("../projects/project.entity").Project;
        folder: import("../folders/folder.entity").Folder | undefined;
        discipline: import("../folders/discipline.entity").Discipline | undefined;
        responsibleUser: import("../users/user.entity").User | undefined;
        uploadedBy: import("../users/user.entity").User;
        currentVersion: import("../versions/document-version.entity").DocumentVersion;
        preview: {
            available: boolean;
            mimeType: string;
            url: string;
        } | {
            available: boolean;
            mimeType: null;
            url: null;
        };
        metadata: import("./document-metadata.entity").DocumentMetadata[];
        versions: import("../versions/document-version.entity").DocumentVersion[];
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
        audit: import("./document-audit-log.entity").DocumentAuditLog[];
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
    content(id: string, user: RequestUser, res: Response): Promise<void>;
    update(id: string, user: RequestUser, dto: UpdateDocumentDto): Promise<{
        project: import("../projects/project.entity").Project;
        folder: import("../folders/folder.entity").Folder | undefined;
        discipline: import("../folders/discipline.entity").Discipline | undefined;
        responsibleUser: import("../users/user.entity").User | undefined;
        uploadedBy: import("../users/user.entity").User;
        currentVersion: import("../versions/document-version.entity").DocumentVersion;
        preview: {
            available: boolean;
            mimeType: string;
            url: string;
        } | {
            available: boolean;
            mimeType: null;
            url: null;
        };
        metadata: import("./document-metadata.entity").DocumentMetadata[];
        versions: import("../versions/document-version.entity").DocumentVersion[];
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
        audit: import("./document-audit-log.entity").DocumentAuditLog[];
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
    comment(id: string, user: RequestUser, dto: CreateDocumentCommentDto): Promise<{
        project: import("../projects/project.entity").Project;
        folder: import("../folders/folder.entity").Folder | undefined;
        discipline: import("../folders/discipline.entity").Discipline | undefined;
        responsibleUser: import("../users/user.entity").User | undefined;
        uploadedBy: import("../users/user.entity").User;
        currentVersion: import("../versions/document-version.entity").DocumentVersion;
        preview: {
            available: boolean;
            mimeType: string;
            url: string;
        } | {
            available: boolean;
            mimeType: null;
            url: null;
        };
        metadata: import("./document-metadata.entity").DocumentMetadata[];
        versions: import("../versions/document-version.entity").DocumentVersion[];
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
        audit: import("./document-audit-log.entity").DocumentAuditLog[];
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
    version(id: string, user: RequestUser, dto: CreateDocumentVersionDto): Promise<{
        project: import("../projects/project.entity").Project;
        folder: import("../folders/folder.entity").Folder | undefined;
        discipline: import("../folders/discipline.entity").Discipline | undefined;
        responsibleUser: import("../users/user.entity").User | undefined;
        uploadedBy: import("../users/user.entity").User;
        currentVersion: import("../versions/document-version.entity").DocumentVersion;
        preview: {
            available: boolean;
            mimeType: string;
            url: string;
        } | {
            available: boolean;
            mimeType: null;
            url: null;
        };
        metadata: import("./document-metadata.entity").DocumentMetadata[];
        versions: import("../versions/document-version.entity").DocumentVersion[];
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
        audit: import("./document-audit-log.entity").DocumentAuditLog[];
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
    requestApproval(id: string, user: RequestUser): Promise<{
        project: import("../projects/project.entity").Project;
        folder: import("../folders/folder.entity").Folder | undefined;
        discipline: import("../folders/discipline.entity").Discipline | undefined;
        responsibleUser: import("../users/user.entity").User | undefined;
        uploadedBy: import("../users/user.entity").User;
        currentVersion: import("../versions/document-version.entity").DocumentVersion;
        preview: {
            available: boolean;
            mimeType: string;
            url: string;
        } | {
            available: boolean;
            mimeType: null;
            url: null;
        };
        metadata: import("./document-metadata.entity").DocumentMetadata[];
        versions: import("../versions/document-version.entity").DocumentVersion[];
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
        audit: import("./document-audit-log.entity").DocumentAuditLog[];
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
    download(id: string, user: RequestUser, res: Response): Promise<void>;
    print(id: string, user: RequestUser): Promise<{
        ok: boolean;
        documentId: string;
        action: string;
    }>;
    approve(id: string, user: RequestUser): Promise<{
        project: import("../projects/project.entity").Project;
        folder: import("../folders/folder.entity").Folder | undefined;
        discipline: import("../folders/discipline.entity").Discipline | undefined;
        responsibleUser: import("../users/user.entity").User | undefined;
        uploadedBy: import("../users/user.entity").User;
        currentVersion: import("../versions/document-version.entity").DocumentVersion;
        preview: {
            available: boolean;
            mimeType: string;
            url: string;
        } | {
            available: boolean;
            mimeType: null;
            url: null;
        };
        metadata: import("./document-metadata.entity").DocumentMetadata[];
        versions: import("../versions/document-version.entity").DocumentVersion[];
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
        audit: import("./document-audit-log.entity").DocumentAuditLog[];
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
    reject(id: string, user: RequestUser): Promise<{
        project: import("../projects/project.entity").Project;
        folder: import("../folders/folder.entity").Folder | undefined;
        discipline: import("../folders/discipline.entity").Discipline | undefined;
        responsibleUser: import("../users/user.entity").User | undefined;
        uploadedBy: import("../users/user.entity").User;
        currentVersion: import("../versions/document-version.entity").DocumentVersion;
        preview: {
            available: boolean;
            mimeType: string;
            url: string;
        } | {
            available: boolean;
            mimeType: null;
            url: null;
        };
        metadata: import("./document-metadata.entity").DocumentMetadata[];
        versions: import("../versions/document-version.entity").DocumentVersion[];
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
        audit: import("./document-audit-log.entity").DocumentAuditLog[];
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
    remove(id: string, user: RequestUser): Promise<{
        project: import("../projects/project.entity").Project;
        folder: import("../folders/folder.entity").Folder | undefined;
        discipline: import("../folders/discipline.entity").Discipline | undefined;
        responsibleUser: import("../users/user.entity").User | undefined;
        uploadedBy: import("../users/user.entity").User;
        currentVersion: import("../versions/document-version.entity").DocumentVersion;
        preview: {
            available: boolean;
            mimeType: string;
            url: string;
        } | {
            available: boolean;
            mimeType: null;
            url: null;
        };
        metadata: import("./document-metadata.entity").DocumentMetadata[];
        versions: import("../versions/document-version.entity").DocumentVersion[];
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
        audit: import("./document-audit-log.entity").DocumentAuditLog[];
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
}
