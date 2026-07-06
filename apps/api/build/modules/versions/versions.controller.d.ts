import { RequestUser } from '../../common/interfaces/request-user.interface';
import { CreateVersionDto } from './dto/create-version.dto';
import { VersionsService } from './versions.service';
export declare class VersionsController {
    private readonly versions;
    constructor(versions: VersionsService);
    list(documentId: string, user: RequestUser): Promise<import("./document-version.entity").DocumentVersion[]>;
    create(dto: CreateVersionDto, user: RequestUser): Promise<{
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
        status: "draft" | "pending_approval" | "in_review" | "approved" | "published" | "expired" | "superseded" | "archived";
        confidentialityLevel: "internal" | "public" | "confidential" | "restricted";
        renewable: boolean;
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
