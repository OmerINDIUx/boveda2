import { Repository } from 'typeorm';
import { AccessScopeService } from '../../common/access-scope.service';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { StorageService } from '../../storage/storage.service';
import { DocumentRecord } from '../documents/document.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ProjectMember } from '../projects/project-member.entity';
import { Project } from '../projects/project.entity';
import { CreateRfiCommentDto } from './dto/create-rfi-comment.dto';
import { CreateRfiDto } from './dto/create-rfi.dto';
import { RespondRfiDto } from './dto/respond-rfi.dto';
import { RfiListQueryDto } from './dto/rfi-list-query.dto';
import { UpdateRfiStatusDto } from './dto/update-rfi-status.dto';
import { RfiAttachment } from './rfi-attachment.entity';
import { RfiComment } from './rfi-comment.entity';
import { RfiHistory } from './rfi-history.entity';
import { Rfi } from './rfi.entity';
export declare class RfisService {
  private readonly rfis;
  private readonly comments;
  private readonly attachments;
  private readonly history;
  private readonly projects;
  private readonly members;
  private readonly documents;
  private readonly scope;
  private readonly storage;
  private readonly notifications;
  constructor(
    rfis: Repository<Rfi>,
    comments: Repository<RfiComment>,
    attachments: Repository<RfiAttachment>,
    history: Repository<RfiHistory>,
    projects: Repository<Project>,
    members: Repository<ProjectMember>,
    documents: Repository<DocumentRecord>,
    scope: AccessScopeService,
    storage: StorageService,
    notifications: NotificationsService
  );
  list(
    user: RequestUser,
    query: RfiListQueryDto
  ): Promise<
    {
      id: string;
      projectId: string;
      documentId: string | undefined;
      title: string;
      description: string;
      answer: string | undefined;
      priority: 'normal' | 'low' | 'high' | 'urgent';
      dueDate: string | undefined;
      status: 'in_progress' | 'closed' | 'overdue' | 'open' | 'answered';
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
    }[]
  >;
  getFormOptions(
    user: RequestUser,
    projectId?: string
  ): Promise<{
    projects: {
      id: string;
      name: string;
      code: string;
    }[];
    projectMembers: {
      id: string;
      name: string;
      email: string;
      role: 'viewer' | 'owner' | 'manager' | 'contributor';
    }[];
    documents: {
      id: string;
      name: string;
      documentNumber: string;
    }[];
  }>;
  getDetail(
    user: RequestUser,
    id: string
  ): Promise<{
    comments: {
      id: string;
      body: string;
      type: 'comment' | 'response' | 'system';
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
    priority: 'normal' | 'low' | 'high' | 'urgent';
    dueDate: string | undefined;
    status: 'in_progress' | 'closed' | 'overdue' | 'open' | 'answered';
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
  create(
    user: RequestUser,
    dto: CreateRfiDto
  ): Promise<{
    comments: {
      id: string;
      body: string;
      type: 'comment' | 'response' | 'system';
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
    priority: 'normal' | 'low' | 'high' | 'urgent';
    dueDate: string | undefined;
    status: 'in_progress' | 'closed' | 'overdue' | 'open' | 'answered';
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
  addComment(
    user: RequestUser,
    rfiId: string,
    dto: CreateRfiCommentDto
  ): Promise<{
    comments: {
      id: string;
      body: string;
      type: 'comment' | 'response' | 'system';
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
    priority: 'normal' | 'low' | 'high' | 'urgent';
    dueDate: string | undefined;
    status: 'in_progress' | 'closed' | 'overdue' | 'open' | 'answered';
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
  respond(
    user: RequestUser,
    rfiId: string,
    dto: RespondRfiDto
  ): Promise<{
    comments: {
      id: string;
      body: string;
      type: 'comment' | 'response' | 'system';
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
    priority: 'normal' | 'low' | 'high' | 'urgent';
    dueDate: string | undefined;
    status: 'in_progress' | 'closed' | 'overdue' | 'open' | 'answered';
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
  updateStatus(
    user: RequestUser,
    rfiId: string,
    dto: UpdateRfiStatusDto
  ): Promise<{
    comments: {
      id: string;
      body: string;
      type: 'comment' | 'response' | 'system';
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
    priority: 'normal' | 'low' | 'high' | 'urgent';
    dueDate: string | undefined;
    status: 'in_progress' | 'closed' | 'overdue' | 'open' | 'answered';
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
  close(
    user: RequestUser,
    rfiId: string,
    note?: string
  ): Promise<{
    comments: {
      id: string;
      body: string;
      type: 'comment' | 'response' | 'system';
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
    priority: 'normal' | 'low' | 'high' | 'urgent';
    dueDate: string | undefined;
    status: 'in_progress' | 'closed' | 'overdue' | 'open' | 'answered';
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
