import { RequestUser } from '../../common/interfaces/request-user.interface';
import { CreateRfiCommentDto } from './dto/create-rfi-comment.dto';
import { CreateRfiDto } from './dto/create-rfi.dto';
import { CreateRfiTemplateDto } from './dto/create-rfi-template.dto';
import { InboundEmailDto } from './dto/inbound-email.dto';
import { RespondRfiDto } from './dto/respond-rfi.dto';
import { RfiListQueryDto } from './dto/rfi-list-query.dto';
import { UpdateRfiStatusDto } from './dto/update-rfi-status.dto';
import { UpdateRfiTemplateDto } from './dto/update-rfi-template.dto';
import { RfisService } from './rfis.service';
export declare class RfisController {
    private readonly rfis;
    constructor(rfis: RfisService);
    listTemplates(user: RequestUser, projectId?: string): Promise<import("./rfi-template.entity").RfiTemplate[]>;
    getTemplate(user: RequestUser, id: string): Promise<import("./rfi-template.entity").RfiTemplate>;
    createTemplate(user: RequestUser, dto: CreateRfiTemplateDto): Promise<import("./rfi-template.entity").RfiTemplate>;
    updateTemplate(user: RequestUser, id: string, dto: UpdateRfiTemplateDto): Promise<import("./rfi-template.entity").RfiTemplate>;
    deleteTemplate(user: RequestUser, id: string): Promise<{
        ok: boolean;
    }>;
    evaluateTemplate(user: RequestUser, id: string, projectId: string): Promise<{
        template: import("./rfi-template.entity").RfiTemplate;
        projectId: string;
        title: string;
        description: string;
        priority: "low" | "normal" | "high" | "urgent";
        dueDate: string | undefined;
        assignedToId: string | undefined;
        assignedToName: string | null;
        projectMembers: {
            id: string;
            name: string;
            email: string;
            role: "owner" | "manager" | "contributor" | "viewer";
        }[];
        documents: {
            id: string;
            name: string;
            documentNumber: string;
        }[];
    }>;
    inboundEmail(dto: InboundEmailDto, apiKey?: string): Promise<{
        ok: boolean;
        reason: string;
        commentId?: undefined;
    } | {
        ok: boolean;
        commentId: string;
        reason?: undefined;
    }> | {
        ok: boolean;
        reason: string;
    };
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
            role: "owner" | "manager" | "contributor" | "viewer";
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
        priority: "low" | "normal" | "high" | "urgent";
        dueDate: string | undefined;
        status: "closed" | "in_progress" | "overdue" | "answered" | "open";
        closedAt: Date | undefined;
        createdAt: Date;
        updatedAt: Date;
        replyToAddress: string | undefined;
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
        template: {
            id: string;
            name: string;
        } | null;
        commentsCount: number;
        attachmentsCount: number;
    }[]>;
    detail(user: RequestUser, id: string): Promise<{
        comments: {
            id: string;
            body: string;
            type: "email" | "comment" | "response" | "system";
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
            emailMessageId: string | undefined;
            emailInReplyTo: string | undefined;
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
        priority: "low" | "normal" | "high" | "urgent";
        dueDate: string | undefined;
        status: "closed" | "in_progress" | "overdue" | "answered" | "open";
        closedAt: Date | undefined;
        createdAt: Date;
        updatedAt: Date;
        replyToAddress: string | undefined;
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
        template: {
            id: string;
            name: string;
        } | null;
        commentsCount: number;
        attachmentsCount: number;
    }>;
    create(user: RequestUser, dto: CreateRfiDto): Promise<{
        comments: {
            id: string;
            body: string;
            type: "email" | "comment" | "response" | "system";
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
            emailMessageId: string | undefined;
            emailInReplyTo: string | undefined;
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
        priority: "low" | "normal" | "high" | "urgent";
        dueDate: string | undefined;
        status: "closed" | "in_progress" | "overdue" | "answered" | "open";
        closedAt: Date | undefined;
        createdAt: Date;
        updatedAt: Date;
        replyToAddress: string | undefined;
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
        template: {
            id: string;
            name: string;
        } | null;
        commentsCount: number;
        attachmentsCount: number;
    }>;
    comment(user: RequestUser, id: string, dto: CreateRfiCommentDto): Promise<{
        comments: {
            id: string;
            body: string;
            type: "email" | "comment" | "response" | "system";
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
            emailMessageId: string | undefined;
            emailInReplyTo: string | undefined;
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
        priority: "low" | "normal" | "high" | "urgent";
        dueDate: string | undefined;
        status: "closed" | "in_progress" | "overdue" | "answered" | "open";
        closedAt: Date | undefined;
        createdAt: Date;
        updatedAt: Date;
        replyToAddress: string | undefined;
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
        template: {
            id: string;
            name: string;
        } | null;
        commentsCount: number;
        attachmentsCount: number;
    }>;
    respond(user: RequestUser, id: string, dto: RespondRfiDto): Promise<{
        comments: {
            id: string;
            body: string;
            type: "email" | "comment" | "response" | "system";
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
            emailMessageId: string | undefined;
            emailInReplyTo: string | undefined;
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
        priority: "low" | "normal" | "high" | "urgent";
        dueDate: string | undefined;
        status: "closed" | "in_progress" | "overdue" | "answered" | "open";
        closedAt: Date | undefined;
        createdAt: Date;
        updatedAt: Date;
        replyToAddress: string | undefined;
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
        template: {
            id: string;
            name: string;
        } | null;
        commentsCount: number;
        attachmentsCount: number;
    }>;
    updateStatus(user: RequestUser, id: string, dto: UpdateRfiStatusDto): Promise<{
        comments: {
            id: string;
            body: string;
            type: "email" | "comment" | "response" | "system";
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
            emailMessageId: string | undefined;
            emailInReplyTo: string | undefined;
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
        priority: "low" | "normal" | "high" | "urgent";
        dueDate: string | undefined;
        status: "closed" | "in_progress" | "overdue" | "answered" | "open";
        closedAt: Date | undefined;
        createdAt: Date;
        updatedAt: Date;
        replyToAddress: string | undefined;
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
        template: {
            id: string;
            name: string;
        } | null;
        commentsCount: number;
        attachmentsCount: number;
    }>;
    close(user: RequestUser, id: string, note?: string): Promise<{
        comments: {
            id: string;
            body: string;
            type: "email" | "comment" | "response" | "system";
            createdAt: Date;
            author: {
                id: string;
                name: string;
                email: string;
            } | null;
            emailMessageId: string | undefined;
            emailInReplyTo: string | undefined;
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
        priority: "low" | "normal" | "high" | "urgent";
        dueDate: string | undefined;
        status: "closed" | "in_progress" | "overdue" | "answered" | "open";
        closedAt: Date | undefined;
        createdAt: Date;
        updatedAt: Date;
        replyToAddress: string | undefined;
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
        template: {
            id: string;
            name: string;
        } | null;
        commentsCount: number;
        attachmentsCount: number;
    }>;
}
