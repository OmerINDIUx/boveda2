import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { AccessScopeService } from '../../common/access-scope.service';
import { StorageService } from '../../storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';
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

const previewableMimeTypes = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'text/plain',
];

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(DocumentRecord) private readonly documents: Repository<DocumentRecord>,
    @InjectRepository(DocumentVersion) private readonly versions: Repository<DocumentVersion>,
    @InjectRepository(ApprovalFlow) private readonly approvalFlows: Repository<ApprovalFlow>,
    @InjectRepository(ApprovalRequest)
    private readonly approvalRequests: Repository<ApprovalRequest>,
    @InjectRepository(DocumentMetadata) private readonly metadata: Repository<DocumentMetadata>,
    @InjectRepository(DocumentAuditLog) private readonly auditLogs: Repository<DocumentAuditLog>,
    @InjectRepository(DocumentComment) private readonly comments: Repository<DocumentComment>,
    @InjectRepository(DocumentPermission)
    private readonly permissions: Repository<DocumentPermission>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(ProjectMember) private readonly members: Repository<ProjectMember>,
    @InjectRepository(Folder) private readonly folders: Repository<Folder>,
    private readonly scope: AccessScopeService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService
  ) {}

  async listVisible(userId: string, query: DocumentListQueryDto) {
    const visibleProjectIds = query.projectId
      ? []
      : await this.scope.visibleProjectIdsForUser(userId);
    if (query.projectId) {
      if (!(await this.scope.canAccessProject(userId, query.projectId))) {
        throw new ForbiddenException('No tienes acceso a este proyecto');
      }
    } else if (!visibleProjectIds.length) {
      return [];
    }

    const builder = this.documents
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.project', 'project')
      .leftJoinAndSelect('document.folder', 'folder')
      .leftJoinAndSelect('document.discipline', 'discipline')
      .leftJoinAndSelect('document.responsibleUser', 'responsibleUser')
      .where(
        query.projectId
          ? 'document.projectId = :projectId'
          : 'document.projectId IN (:...projectIds)',
        {
          projectId: query.projectId,
          projectIds: query.projectId ? undefined : visibleProjectIds,
        }
      )
      .orderBy('document.updatedAt', 'DESC');

    if (query.search) {
      builder.andWhere(
        '(document.name LIKE :search OR document.documentNumber LIKE :search OR discipline.name LIKE :search OR project.name LIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    const rawItems = await builder.getMany();
    const items = await this.filterDocumentsByPermissions(
      userId,
      query.projectId ? [query.projectId] : visibleProjectIds,
      rawItems
    );
    return items.map((item) => this.toListItem(item));
  }

  async create(userId: string, dto: CreateDocumentDto) {
    if (!(await this.scope.canAccessProject(userId, dto.projectId))) {
      throw new ForbiddenException('No tienes acceso a este proyecto');
    }
    const folder = await this.resolveProjectFolder(dto.projectId, dto.folderId);

    const stored = await this.storeBase64File(dto.base64Content, dto.fileName, dto.mimeType);
    const document = await this.documents.save(
      this.documents.create({
        projectId: dto.projectId,
        folderId: folder.id,
        disciplineId: dto.disciplineId,
        responsibleUserId: dto.responsibleUserId,
        documentNumber: dto.documentNumber,
        name: dto.name ?? dto.title ?? dto.fileName,
        status: dto.status ?? 'draft',
        confidentialityLevel: dto.confidentialityLevel ?? 'internal',
        renewable: dto.renewable ?? false,
        renewalFrequency: dto.renewable ? (dto.renewalFrequency ?? null) : null,
        dueDate: dto.dueDate,
        originalFileKey: stored.key,
        fileExtension: this.getExtension(dto.fileName),
        sizeBytes: dto.sizeBytes ?? stored.sizeBytes,
        uploadedById: userId,
      })
    );

    const version = await this.versions.save(
      this.versions.create({
        documentId: document.id,
        revision: dto.revision ?? 'A',
        fileKey: stored.key,
        fileName: dto.fileName,
        fileExtension: this.getExtension(dto.fileName),
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes ?? stored.sizeBytes,
        uploadedById: userId,
        notes: dto.notes,
      })
    );

    document.currentVersionId = version.id;
    await this.documents.save(document);

    if (dto.metadata?.length) {
      await this.metadata.save(
        dto.metadata.map((item) =>
          this.metadata.create({
            documentId: document.id,
            metaKey: item.key,
            metaValue: item.value,
            valueType: item.type ?? 'string',
          })
        )
      );
    }

    await this.log(document.id, userId, 'upload_new_version', undefined, {
      versionId: version.id,
      revision: version.revision,
      fileName: version.fileName,
    });
    await this.notifyDocumentVersion(
      document.id,
      document.name,
      document.documentNumber,
      version.revision,
      [document.responsibleUserId, document.uploadedById]
    );

    return this.getDetail(userId, document.id, false);
  }

  async getDetail(userId: string, documentId: string, logView = true) {
    const document = await this.documents.findOne({
      where: { id: documentId },
      relations: ['project', 'folder', 'discipline', 'responsibleUser', 'uploadedBy'],
    });
    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }
    if (
      !(await this.scope.canAccessProject(userId, document.projectId)) ||
      !(await this.canAccessDocument(userId, document))
    ) {
      throw new ForbiddenException('No tienes acceso a este documento');
    }

    const [versions, metadata, comments, audit] = await Promise.all([
      this.versions.find({
        where: { documentId },
        relations: ['uploadedBy'],
        order: { createdAt: 'DESC' },
      }),
      this.metadata.find({ where: { documentId } }),
      this.comments.find({
        where: { documentId },
        relations: ['author'],
        order: { createdAt: 'DESC' },
      }),
      this.auditLogs.find({ where: { documentId }, order: { createdAt: 'DESC' } }),
    ]);

    if (logView) {
      await this.log(document.id, userId, 'visualization');
    }

    const currentVersion =
      versions.find((version) => version.id === document.currentVersionId) ?? versions[0] ?? null;

    return {
      ...this.toListItem(document),
      project: document.project,
      folder: document.folder,
      discipline: document.discipline,
      responsibleUser: document.responsibleUser,
      uploadedBy: document.uploadedBy,
      currentVersion,
      preview: currentVersion
        ? {
            available: previewableMimeTypes.includes(currentVersion.mimeType),
            mimeType: currentVersion.mimeType,
            url: `/api/documents/${document.id}/content`,
          }
        : { available: false, mimeType: null, url: null },
      metadata,
      versions,
      comments: comments.map((comment) => ({
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt,
        author: comment.author
          ? { id: comment.author.id, name: comment.author.name, email: comment.author.email }
          : null,
      })),
      audit,
    };
  }

  async update(userId: string, documentId: string, dto: UpdateDocumentDto) {
    const document = await this.assertDocumentAccess(userId, documentId);
    const beforeState = {
      name: document.name,
      folderId: document.folderId,
      disciplineId: document.disciplineId,
      responsibleUserId: document.responsibleUserId,
      confidentialityLevel: document.confidentialityLevel,
      renewable: document.renewable,
      renewalFrequency: document.renewalFrequency,
      dueDate: document.dueDate,
      status: document.status,
    };

    if (dto.folderId !== undefined) {
      const folder = await this.resolveProjectFolder(document.projectId, dto.folderId);
      document.folderId = folder.id;
    }

    Object.assign(document, { ...dto, folderId: document.folderId });
    if (!document.renewable) {
      document.renewalFrequency = null;
    }
    if (dto.status === 'published' && !(await this.canPublish(document.id, document.projectId))) {
      throw new ForbiddenException('Este documento requiere aprobación antes de publicarse');
    }
    if (
      document.dueDate &&
      new Date(`${document.dueDate}T00:00:00`).getTime() <
        new Date(new Date().toDateString()).getTime()
    ) {
      document.status = 'expired';
    }

    await this.documents.save(document);
    await this.log(document.id, userId, 'edit', beforeState, dto as Record<string, unknown>);

    return this.getDetail(userId, documentId, false);
  }

  async createVersion(userId: string, documentId: string, dto: CreateDocumentVersionDto) {
    const document = await this.assertDocumentAccess(userId, documentId);
    const stored = await this.storeBase64File(dto.base64Content, dto.fileName, dto.mimeType);

    const version = await this.versions.save(
      this.versions.create({
        documentId,
        revision: dto.revision,
        fileKey: stored.key,
        fileName: dto.fileName,
        fileExtension: this.getExtension(dto.fileName),
        mimeType: dto.mimeType,
        sizeBytes: dto.sizeBytes ?? stored.sizeBytes,
        uploadedById: userId,
        notes: dto.notes,
      })
    );

    const previousVersionId = document.currentVersionId;
    document.currentVersionId = version.id;
    document.originalFileKey = stored.key;
    document.fileExtension = this.getExtension(dto.fileName);
    document.sizeBytes = dto.sizeBytes ?? stored.sizeBytes;
    document.uploadedById = userId;
    await this.documents.save(document);

    await this.log(
      document.id,
      userId,
      'upload_new_version',
      { previousVersionId },
      { versionId: version.id, revision: dto.revision }
    );
    await this.notifyDocumentVersion(
      document.id,
      document.name,
      document.documentNumber,
      version.revision,
      [document.responsibleUserId, document.uploadedById]
    );
    return this.getDetail(userId, documentId, false);
  }

  async addComment(userId: string, documentId: string, dto: CreateDocumentCommentDto) {
    await this.assertDocumentAccess(userId, documentId);
    const comment = await this.comments.save(
      this.comments.create({
        documentId,
        authorId: userId,
        body: dto.body,
      })
    );
    await this.log(documentId, userId, 'comment', undefined, { commentId: comment.id });
    return this.getDetail(userId, documentId, false);
  }

  async requestApproval(userId: string, documentId: string) {
    const document = await this.assertDocumentAccess(userId, documentId);
    const beforeStatus = document.status;
    document.status = 'pending_approval';
    await this.documents.save(document);
    await this.log(
      documentId,
      userId,
      'request_approval',
      { status: beforeStatus },
      { status: document.status }
    );
    return this.getDetail(userId, documentId, false);
  }

  async approve(userId: string, documentId: string) {
    const document = await this.assertDocumentAccess(userId, documentId);
    const beforeStatus = document.status;
    document.status = 'approved';
    await this.documents.save(document);
    await this.log(
      documentId,
      userId,
      'approval',
      { status: beforeStatus },
      { status: document.status }
    );
    await this.notifyDocumentDecision(
      document.id,
      document.name,
      document.documentNumber,
      'approved',
      [document.responsibleUserId, document.uploadedById]
    );
    return this.getDetail(userId, documentId, false);
  }

  async reject(userId: string, documentId: string) {
    const document = await this.assertDocumentAccess(userId, documentId);
    const beforeStatus = document.status;
    document.status = 'in_review';
    await this.documents.save(document);
    await this.log(
      documentId,
      userId,
      'rejection',
      { status: beforeStatus },
      { status: document.status }
    );
    await this.notifyDocumentDecision(
      document.id,
      document.name,
      document.documentNumber,
      'rejected',
      [document.responsibleUserId, document.uploadedById]
    );
    return this.getDetail(userId, documentId, false);
  }

  async getCurrentContent(userId: string, documentId: string) {
    const document = await this.assertDocumentAccess(userId, documentId);
    const version = await this.versions.findOne({ where: { id: document.currentVersionId ?? '' } });
    if (!version) {
      throw new NotFoundException('No hay versión actual para este documento');
    }

    return this.readCurrentVersion(document, version);
  }

  async download(userId: string, documentId: string) {
    const document = await this.assertDocumentAccess(userId, documentId);
    const version = await this.versions.findOne({ where: { id: document.currentVersionId ?? '' } });
    if (!version) {
      throw new NotFoundException('No hay versión actual para este documento');
    }

    const content = await this.readCurrentVersion(document, version);
    await this.log(documentId, userId, 'download');
    return content;
  }

  async print(userId: string, documentId: string) {
    const document = await this.assertDocumentAccess(userId, documentId);
    await this.log(document.id, userId, 'print');
    return { ok: true, documentId, action: 'print' };
  }

  async assertDocumentAccess(userId: string, documentId: string) {
    const document = await this.documents.findOne({ where: { id: documentId } });
    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }
    if (
      !(await this.scope.canAccessProject(userId, document.projectId)) ||
      !(await this.canAccessDocument(userId, document))
    ) {
      throw new ForbiddenException('No tienes acceso a este documento');
    }

    return document;
  }

  private async canAccessDocument(userId: string, document: DocumentRecord) {
    const visible = await this.filterDocumentsByPermissions(
      userId,
      [document.projectId],
      [document]
    );
    return visible.length > 0;
  }

  private async filterDocumentsByPermissions(
    userId: string,
    projectIds: string[],
    rawDocuments: DocumentRecord[]
  ) {
    if (!rawDocuments.length) {
      return [];
    }

    const user = await this.users.findOne({ where: { id: userId }, relations: ['roles'] });
    if (!user) {
      return [];
    }

    const memberships = await this.members.find({
      where: { userId, projectId: In(projectIds) },
    });
    const roleIds = user.roles?.map((role) => role.id) ?? [];
    const projectUserIds = memberships.map((membership) => membership.id);
    const permissionRows = await this.permissions.find({
      where: { documentId: In(rawDocuments.map((document) => document.id)), deletedAt: IsNull() },
    });

    return rawDocuments.filter((document) => {
      const rows = permissionRows.filter((row) => row.documentId === document.id);
      if (!rows.length) {
        return true;
      }

      return rows.some((row) => {
        if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
          return false;
        }

        return (
          row.userId === userId ||
          (row.roleId ? roleIds.includes(row.roleId) : false) ||
          (row.projectUserId ? projectUserIds.includes(row.projectUserId) : false)
        );
      });
    });
  }

  private async storeBase64File(base64Content: string, fileName: string, mimeType: string) {
    const cleanBase64 = base64Content.includes(',') ? base64Content.split(',')[1] : base64Content;
    const buffer = Buffer.from(cleanBase64, 'base64');
    return this.storage.put(buffer, fileName, mimeType);
  }

  private async resolveProjectFolder(projectId: string, folderId?: string) {
    if (!folderId) {
      throw new BadRequestException('Selecciona una carpeta para el documento');
    }

    const folder = await this.folders.findOne({ where: { id: folderId, projectId } });
    if (!folder) {
      throw new BadRequestException('La carpeta seleccionada no pertenece al proyecto');
    }

    return folder;
  }

  private async readCurrentVersion(document: DocumentRecord, version: DocumentVersion) {
    const buffer = await this.storage.read(version.fileKey);
    return {
      buffer,
      fileName: version.fileName,
      mimeType: version.mimeType,
      documentId: document.id,
    };
  }

  private getExtension(fileName: string) {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts.at(-1)?.toLowerCase() : undefined;
  }

  private async canPublish(documentId: string, projectId: string) {
    const applicableFlow = await this.approvalFlows.findOne({
      where: [
        {
          projectId,
          entityType: 'document',
          scopeType: 'document_specific',
          targetDocumentId: documentId,
          active: true,
        },
        {
          projectId,
          entityType: 'document',
          scopeType: 'global',
          targetDocumentId: IsNull(),
          active: true,
        },
      ],
      order: { createdAt: 'DESC' },
    });

    if (!applicableFlow || !applicableFlow.requireForPublication) {
      return true;
    }

    const approvedRequest = await this.approvalRequests.findOne({
      where: {
        entityId: documentId,
        entityType: 'document',
        workflowId: applicableFlow.id,
        status: 'approved',
      },
      order: { completedAt: 'DESC' },
    });

    return Boolean(approvedRequest);
  }

  private toListItem(document: DocumentRecord) {
    return {
      id: document.id,
      name: document.name,
      documentNumber: document.documentNumber,
      status: document.status,
      confidentialityLevel: document.confidentialityLevel,
      renewable: document.renewable,
      renewalFrequency: document.renewalFrequency,
      dueDate: document.dueDate,
      fileExtension: document.fileExtension,
      sizeBytes: document.sizeBytes,
      projectId: document.projectId,
      folderId: document.folderId,
      disciplineId: document.disciplineId,
      responsibleUserId: document.responsibleUserId,
      currentVersionId: document.currentVersionId,
      updatedAt: document.updatedAt,
      createdAt: document.createdAt,
      project: document.project,
      folder: document.folder,
      discipline: document.discipline,
      responsibleUser: document.responsibleUser,
    };
  }

  private async log(
    documentId: string,
    actorId: string,
    action: string,
    beforeState?: Record<string, unknown>,
    afterState?: Record<string, unknown>
  ) {
    await this.auditLogs.save(
      this.auditLogs.create({
        documentId,
        actorId,
        action,
        beforeState,
        afterState,
      })
    );
  }

  private async notifyDocumentVersion(
    documentId: string,
    name: string,
    documentNumber: string,
    revision: string,
    userIds: Array<string | undefined>
  ) {
    await this.notifications.notify({
      recipients: userIds
        .filter((userId): userId is string => Boolean(userId))
        .map((userId) => ({ userId })),
      notificationType: 'document_new_version',
      title: `Nueva versión de documento: ${name}`,
      body: `Se publicó la revisión ${revision} del documento ${documentNumber}.`,
      entityType: 'document',
      entityId: documentId,
      category: 'document',
      meta: { route: '/documents' },
    });
  }

  private async notifyDocumentDecision(
    documentId: string,
    name: string,
    documentNumber: string,
    result: 'approved' | 'rejected',
    userIds: Array<string | undefined>
  ) {
    const label = result === 'approved' ? 'aprobado' : 'rechazado';
    await this.notifications.notify({
      recipients: userIds
        .filter((userId): userId is string => Boolean(userId))
        .map((userId) => ({ userId })),
      notificationType: 'document_approval_result',
      title: `Documento ${label}: ${name}`,
      body: `El documento ${documentNumber} fue ${label}.`,
      entityType: 'document',
      entityId: documentId,
      category: 'approval',
      meta: { route: '/documents' },
    });
  }
}
