import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { AccessScopeService } from '../../common/access-scope.service';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { StorageService } from '../../storage/storage.service';
import { DocumentRecord } from '../documents/document.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ProjectMember } from '../projects/project-member.entity';
import { Project } from '../projects/project.entity';
import { User } from '../users/user.entity';
import { CreateRfiCommentDto } from './dto/create-rfi-comment.dto';
import { CreateRfiDto } from './dto/create-rfi.dto';
import { CreateRfiTemplateDto } from './dto/create-rfi-template.dto';
import { InboundEmailDto } from './dto/inbound-email.dto';
import { RespondRfiDto } from './dto/respond-rfi.dto';
import { RfiListQueryDto } from './dto/rfi-list-query.dto';
import { UpdateRfiStatusDto } from './dto/update-rfi-status.dto';
import { UpdateRfiTemplateDto } from './dto/update-rfi-template.dto';
import { RfiAttachment } from './rfi-attachment.entity';
import { RfiComment } from './rfi-comment.entity';
import { RfiHistory } from './rfi-history.entity';
import { RfiTemplate } from './rfi-template.entity';
import { Rfi } from './rfi.entity';
export declare class RfisService {
    private readonly rfis;
    private readonly comments;
    private readonly attachments;
    private readonly history;
    private readonly templates;
    private readonly projects;
    private readonly members;
    private readonly documents;
    private readonly users;
    private readonly config;
    private readonly scope;
    private readonly storage;
    private readonly notifications;
    private readonly logger;
    constructor(rfis: Repository<Rfi>, comments: Repository<RfiComment>, attachments: Repository<RfiAttachment>, history: Repository<RfiHistory>, templates: Repository<RfiTemplate>, projects: Repository<Project>, members: Repository<ProjectMember>, documents: Repository<DocumentRecord>, users: Repository<User>, config: ConfigService, scope: AccessScopeService, storage: StorageService, notifications: NotificationsService);
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
    getFormOptions(user: RequestUser, projectId?: string): Promise<{
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
    getDetail(user: RequestUser, id: string): Promise<{
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
    addComment(user: RequestUser, rfiId: string, dto: CreateRfiCommentDto): Promise<{
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
    respond(user: RequestUser, rfiId: string, dto: RespondRfiDto): Promise<{
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
    updateStatus(user: RequestUser, rfiId: string, dto: UpdateRfiStatusDto): Promise<{
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
    close(user: RequestUser, rfiId: string, note?: string): Promise<{
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
    listTemplates(user: RequestUser, projectId?: string): Promise<RfiTemplate[]>;
    getTemplate(user: RequestUser, id: string): Promise<RfiTemplate>;
    createTemplate(user: RequestUser, dto: CreateRfiTemplateDto): Promise<RfiTemplate>;
    updateTemplate(user: RequestUser, id: string, dto: UpdateRfiTemplateDto): Promise<RfiTemplate>;
    deleteTemplate(user: RequestUser, id: string): Promise<{
        ok: boolean;
    }>;
    evaluateTemplate(user: RequestUser, templateId: string, projectId: string): Promise<{
        template: RfiTemplate;
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
    private resolveAutoAssign;
    private generateReplyToAddress;
    processInboundEmail(dto: InboundEmailDto): Promise<{
        ok: boolean;
        reason: string;
        commentId?: undefined;
    } | {
        ok: boolean;
        commentId: string;
        reason?: undefined;
    }>;
    private assertAccess;
    private assertRfiAccess;
    private resolveVisibleProjectIds;
    private assertAssignment;
    private assertDocument;
    private loadRfiWithRelations;
    private serializeListItem;
    private serializeDetail;
    private serializeAttachment;
    private createAttachments;
    private logHistory;
    private snapshot;
    private shouldBeOverdue;
    private markOverdue;
    private notifyAssignedOnActivity;
}
