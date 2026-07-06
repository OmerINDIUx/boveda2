import { RequestUser } from '../../common/interfaces/request-user.interface';
import { CreateRfiCommentDto } from './dto/create-rfi-comment.dto';
import { CreateRfiDto } from './dto/create-rfi.dto';
import { RespondRfiDto } from './dto/respond-rfi.dto';
import { RfiListQueryDto } from './dto/rfi-list-query.dto';
import { UpdateRfiStatusDto } from './dto/update-rfi-status.dto';
import { RfisService } from './rfis.service';
export declare class RfisController {
    private readonly rfis;
    constructor(rfis: RfisService);
    formOptions(user: RequestUser, projectId?: string): Promise<{
        projects: {
            id: string;
            name: string;
            code: string;
        }[];
        projectMembers: {
            id: string;
            name: string;
            email: string;
            role: "viewer" | "owner" | "manager" | "contributor";
        }[];
        documents: {
            id: string;
            name: string;
            documentNumber: string;
        }[];
    }>;
    list(user: RequestUser, query: RfiListQueryDto): Promise<{
        id: string;
        projectId: string;
        documentId: string | undefined;
        title: string;
        description: string;
        answer: string | undefined;
        priority: "normal" | "low" | "high" | "urgent";
        dueDate: string | undefined;
        status: "in_progress" | "closed" | "overdue" | "open" | "answered";
        closedAt: Date | undefined;
        createdAt: Date;
        updatedAt: Date;
        requester: {
            id: string;
            name: string;
            email: string;
        } | null;
        assignedTo: {
            id: string;
            name: string;
            email: string;
        } | null;
        project: {
            id: string;
            name: string;
            code: string;
        } | null;
        document: {
            id: string;
            name: string;
            documentNumber: string;
        } | null;
        commentsCount: number;
        attachmentsCount: number;
    }[]>;
    detail(user: RequestUser, id: string): Promise<{
        comments: {
            id: string;
            body: string;
            type: "comment" | "response" | "system";
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
            attachments: {
                id: string;
                fileName: string;
                mimeType: string;
                sizeBytes: number;
                createdAt: Date;
                uploadedBy: {
                    id: string;
                    name: string;
                    email: string;
                } | null;
            }[];
        }[];
        attachments: {
            id: string;
            fileName: string;
            mimeType: string;
            sizeBytes: number;
            createdAt: Date;
            uploadedBy: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        history: {
            id: string;
            action: string;
            beforeState: Record<string, unknown> | undefined;
            afterState: Record<string, unknown> | undefined;
            createdAt: Date;
            actor: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        id: string;
        projectId: string;
        documentId: string | undefined;
        title: string;
        description: string;
        answer: string | undefined;
        priority: "normal" | "low" | "high" | "urgent";
        dueDate: string | undefined;
        status: "in_progress" | "closed" | "overdue" | "open" | "answered";
        closedAt: Date | undefined;
        createdAt: Date;
        updatedAt: Date;
        requester: {
            id: string;
            name: string;
            email: string;
        } | null;
        assignedTo: {
            id: string;
            name: string;
            email: string;
        } | null;
        project: {
            id: string;
            name: string;
            code: string;
        } | null;
        document: {
            id: string;
            name: string;
            documentNumber: string;
        } | null;
        commentsCount: number;
        attachmentsCount: number;
    }>;
    create(user: RequestUser, dto: CreateRfiDto): Promise<{
        comments: {
            id: string;
            body: string;
            type: "comment" | "response" | "system";
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
            attachments: {
                id: string;
                fileName: string;
                mimeType: string;
                sizeBytes: number;
                createdAt: Date;
                uploadedBy: {
                    id: string;
                    name: string;
                    email: string;
                } | null;
            }[];
        }[];
        attachments: {
            id: string;
            fileName: string;
            mimeType: string;
            sizeBytes: number;
            createdAt: Date;
            uploadedBy: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        history: {
            id: string;
            action: string;
            beforeState: Record<string, unknown> | undefined;
            afterState: Record<string, unknown> | undefined;
            createdAt: Date;
            actor: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        id: string;
        projectId: string;
        documentId: string | undefined;
        title: string;
        description: string;
        answer: string | undefined;
        priority: "normal" | "low" | "high" | "urgent";
        dueDate: string | undefined;
        status: "in_progress" | "closed" | "overdue" | "open" | "answered";
        closedAt: Date | undefined;
        createdAt: Date;
        updatedAt: Date;
        requester: {
            id: string;
            name: string;
            email: string;
        } | null;
        assignedTo: {
            id: string;
            name: string;
            email: string;
        } | null;
        project: {
            id: string;
            name: string;
            code: string;
        } | null;
        document: {
            id: string;
            name: string;
            documentNumber: string;
        } | null;
        commentsCount: number;
        attachmentsCount: number;
    }>;
    comment(user: RequestUser, id: string, dto: CreateRfiCommentDto): Promise<{
        comments: {
            id: string;
            body: string;
            type: "comment" | "response" | "system";
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
            attachments: {
                id: string;
                fileName: string;
                mimeType: string;
                sizeBytes: number;
                createdAt: Date;
                uploadedBy: {
                    id: string;
                    name: string;
                    email: string;
                } | null;
            }[];
        }[];
        attachments: {
            id: string;
            fileName: string;
            mimeType: string;
            sizeBytes: number;
            createdAt: Date;
            uploadedBy: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        history: {
            id: string;
            action: string;
            beforeState: Record<string, unknown> | undefined;
            afterState: Record<string, unknown> | undefined;
            createdAt: Date;
            actor: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        id: string;
        projectId: string;
        documentId: string | undefined;
        title: string;
        description: string;
        answer: string | undefined;
        priority: "normal" | "low" | "high" | "urgent";
        dueDate: string | undefined;
        status: "in_progress" | "closed" | "overdue" | "open" | "answered";
        closedAt: Date | undefined;
        createdAt: Date;
        updatedAt: Date;
        requester: {
            id: string;
            name: string;
            email: string;
        } | null;
        assignedTo: {
            id: string;
            name: string;
            email: string;
        } | null;
        project: {
            id: string;
            name: string;
            code: string;
        } | null;
        document: {
            id: string;
            name: string;
            documentNumber: string;
        } | null;
        commentsCount: number;
        attachmentsCount: number;
    }>;
    respond(user: RequestUser, id: string, dto: RespondRfiDto): Promise<{
        comments: {
            id: string;
            body: string;
            type: "comment" | "response" | "system";
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
            attachments: {
                id: string;
                fileName: string;
                mimeType: string;
                sizeBytes: number;
                createdAt: Date;
                uploadedBy: {
                    id: string;
                    name: string;
                    email: string;
                } | null;
            }[];
        }[];
        attachments: {
            id: string;
            fileName: string;
            mimeType: string;
            sizeBytes: number;
            createdAt: Date;
            uploadedBy: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        history: {
            id: string;
            action: string;
            beforeState: Record<string, unknown> | undefined;
            afterState: Record<string, unknown> | undefined;
            createdAt: Date;
            actor: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        id: string;
        projectId: string;
        documentId: string | undefined;
        title: string;
        description: string;
        answer: string | undefined;
        priority: "normal" | "low" | "high" | "urgent";
        dueDate: string | undefined;
        status: "in_progress" | "closed" | "overdue" | "open" | "answered";
        closedAt: Date | undefined;
        createdAt: Date;
        updatedAt: Date;
        requester: {
            id: string;
            name: string;
            email: string;
        } | null;
        assignedTo: {
            id: string;
            name: string;
            email: string;
        } | null;
        project: {
            id: string;
            name: string;
            code: string;
        } | null;
        document: {
            id: string;
            name: string;
            documentNumber: string;
        } | null;
        commentsCount: number;
        attachmentsCount: number;
    }>;
    updateStatus(user: RequestUser, id: string, dto: UpdateRfiStatusDto): Promise<{
        comments: {
            id: string;
            body: string;
            type: "comment" | "response" | "system";
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
            attachments: {
                id: string;
                fileName: string;
                mimeType: string;
                sizeBytes: number;
                createdAt: Date;
                uploadedBy: {
                    id: string;
                    name: string;
                    email: string;
                } | null;
            }[];
        }[];
        attachments: {
            id: string;
            fileName: string;
            mimeType: string;
            sizeBytes: number;
            createdAt: Date;
            uploadedBy: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        history: {
            id: string;
            action: string;
            beforeState: Record<string, unknown> | undefined;
            afterState: Record<string, unknown> | undefined;
            createdAt: Date;
            actor: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        id: string;
        projectId: string;
        documentId: string | undefined;
        title: string;
        description: string;
        answer: string | undefined;
        priority: "normal" | "low" | "high" | "urgent";
        dueDate: string | undefined;
        status: "in_progress" | "closed" | "overdue" | "open" | "answered";
        closedAt: Date | undefined;
        createdAt: Date;
        updatedAt: Date;
        requester: {
            id: string;
            name: string;
            email: string;
        } | null;
        assignedTo: {
            id: string;
            name: string;
            email: string;
        } | null;
        project: {
            id: string;
            name: string;
            code: string;
        } | null;
        document: {
            id: string;
            name: string;
            documentNumber: string;
        } | null;
        commentsCount: number;
        attachmentsCount: number;
    }>;
    close(user: RequestUser, id: string, note?: string): Promise<{
        comments: {
            id: string;
            body: string;
            type: "comment" | "response" | "system";
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
            attachments: {
                id: string;
                fileName: string;
                mimeType: string;
                sizeBytes: number;
                createdAt: Date;
                uploadedBy: {
                    id: string;
                    name: string;
                    email: string;
                } | null;
            }[];
        }[];
        attachments: {
            id: string;
            fileName: string;
            mimeType: string;
            sizeBytes: number;
            createdAt: Date;
            uploadedBy: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        history: {
            id: string;
            action: string;
            beforeState: Record<string, unknown> | undefined;
            afterState: Record<string, unknown> | undefined;
            createdAt: Date;
            actor: {
                id: string;
                name: string;
                email: string;
            } | null;
        }[];
        id: string;
        projectId: string;
        documentId: string | undefined;
        title: string;
        description: string;
        answer: string | undefined;
        priority: "normal" | "low" | "high" | "urgent";
        dueDate: string | undefined;
        status: "in_progress" | "closed" | "overdue" | "open" | "answered";
        closedAt: Date | undefined;
        createdAt: Date;
        updatedAt: Date;
        requester: {
            id: string;
            name: string;
            email: string;
        } | null;
        assignedTo: {
            id: string;
            name: string;
            email: string;
        } | null;
        project: {
            id: string;
            name: string;
            code: string;
        } | null;
        document: {
            id: string;
            name: string;
            documentNumber: string;
        } | null;
        commentsCount: number;
        attachmentsCount: number;
    }>;
}
