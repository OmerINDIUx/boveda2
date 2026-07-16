import { DocumentsService } from '../documents/documents.service';
import { CreateVersionDto } from './dto/create-version.dto';
export declare class VersionsService {
    private readonly documents;
    constructor(documents: DocumentsService);
    listByDocument(userId: string, documentId: string): Promise<import("./document-version.entity").DocumentVersion[]>;
    create(dto: CreateVersionDto, uploadedById: string): Promise<{
        project: import("../projects/project.entity").Project;
        folder: import("../folders/folder.entity").Folder | undefined;
        discipline: import("../folders/discipline.entity").Discipline | undefined;
        responsibleUser: import("../users/user.entity").User | undefined;
        uploadedBy: import("../users/user.entity").User;
        currentVersion: import("./document-version.entity").DocumentVersion;
        preview: {
            available: boolean;
            mimeType: string;
            url: string;
        } | {
            available: boolean;
            mimeType: null;
            url: null;
        };
        metadata: import("../documents/document-metadata.entity").DocumentMetadata[];
        versions: import("./document-version.entity").DocumentVersion[];
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
        audit: import("../documents/document-audit-log.entity").DocumentAuditLog[];
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
