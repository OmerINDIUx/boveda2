import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'node:crypto';
import { In, IsNull, LessThan, Not, Repository } from 'typeorm';
import { AccessScopeService } from '../../common/access-scope.service';
import { PermissionKey } from '../../common/permissions';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { StorageService } from '../../storage/storage.service';
import { DocumentRecord } from '../documents/document.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ProjectMember } from '../projects/project-member.entity';
import { Project } from '../projects/project.entity';
import { User } from '../users/user.entity';
import { CreateRfiCommentDto } from './dto/create-rfi-comment.dto';
import { CreateRfiDto, RfiAttachmentInputDto } from './dto/create-rfi.dto';
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

@Injectable()
export class RfisService {
  private readonly logger = new Logger(RfisService.name);

  constructor(
    @InjectRepository(Rfi) private readonly rfis: Repository<Rfi>,
    @InjectRepository(RfiComment) private readonly comments: Repository<RfiComment>,
    @InjectRepository(RfiAttachment) private readonly attachments: Repository<RfiAttachment>,
    @InjectRepository(RfiHistory) private readonly history: Repository<RfiHistory>,
    @InjectRepository(RfiTemplate) private readonly templates: Repository<RfiTemplate>,
    @InjectRepository(Project) private readonly projects: Repository<Project>,
    @InjectRepository(ProjectMember) private readonly members: Repository<ProjectMember>,
    @InjectRepository(DocumentRecord) private readonly documents: Repository<DocumentRecord>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly config: ConfigService,
    private readonly scope: AccessScopeService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService
  ) {}

  async list(user: RequestUser, query: RfiListQueryDto) {
    const visibleProjectIds = await this.resolveVisibleProjectIds(user.id, query.projectId);
    if (!visibleProjectIds.length) {
      return [];
    }

    await this.markOverdue(visibleProjectIds);

    const builder = this.rfis
      .createQueryBuilder('rfi')
      .leftJoinAndSelect('rfi.project', 'project')
      .leftJoinAndSelect('rfi.requester', 'requester')
      .leftJoinAndSelect('rfi.assignedTo', 'assignedTo')
      .leftJoinAndSelect('rfi.document', 'document')
      .leftJoinAndSelect('rfi.attachments', 'attachments')
      .leftJoinAndSelect('rfi.comments', 'comments')
      .where('rfi.projectId IN (:...projectIds)', { projectIds: visibleProjectIds })
      .orderBy('rfi.updatedAt', 'DESC');

    if (query.status) {
      builder.andWhere('rfi.status = :status', { status: query.status });
    }
    if (query.priority) {
      builder.andWhere('rfi.priority = :priority', { priority: query.priority });
    }
    if (query.assignedToId) {
      builder.andWhere('rfi.assignedToId = :assignedToId', { assignedToId: query.assignedToId });
    }
    if (query.search) {
      builder.andWhere(
        '(rfi.subject LIKE :search OR rfi.question LIKE :search OR document.name LIKE :search OR project.name LIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    const items = await builder.getMany();
    return items.map((item) =>
      this.serializeListItem(item, user.permissions.includes(PermissionKey.DocumentsView))
    );
  }

  async getFormOptions(user: RequestUser, projectId?: string) {
    const visibleProjectIds = await this.resolveVisibleProjectIds(user.id, projectId);
    const projects = visibleProjectIds.length
      ? await this.projects.find({ where: { id: In(visibleProjectIds) }, order: { name: 'ASC' } })
      : [];

    if (!projectId) {
      return {
        projects: projects.map((project) => ({
          id: project.id,
          name: project.name,
          code: project.code,
        })),
        projectMembers: [],
        documents: [],
      };
    }

    const [members, documents] = await Promise.all([
      this.members.find({
        where: { projectId },
        relations: ['user'],
        order: { createdAt: 'ASC' },
      }),
      user.permissions.includes(PermissionKey.DocumentsView)
        ? this.documents.find({
            where: { projectId },
            order: { updatedAt: 'DESC' },
          })
        : Promise.resolve([]),
    ]);

    return {
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        code: project.code,
      })),
      projectMembers: members
        .filter((member) => member.user)
        .map((member) => ({
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
          role: member.role,
        })),
      documents: documents.map((document) => ({
        id: document.id,
        name: document.name,
        documentNumber: document.documentNumber,
      })),
    };
  }

  async getDetail(user: RequestUser, id: string) {
    await this.markOverdue();
    const rfi = await this.loadRfiWithRelations(id);
    if (!rfi) {
      throw new NotFoundException('RFI no encontrado');
    }
    await this.assertAccess(user.id, rfi.projectId);
    return this.serializeDetail(rfi, user.permissions.includes(PermissionKey.DocumentsView));
  }

  async create(user: RequestUser, dto: CreateRfiDto) {
    await this.assertAccess(user.id, dto.projectId);
    await this.assertAssignment(dto.projectId, dto.assignedToId);
    await this.assertDocument(dto.projectId, dto.documentId);

    let assignedToId = dto.assignedToId;
    const templateId = dto.templateId;
    let dueDate = dto.dueDate;
    const priority = dto.priority ?? 'normal';

    if (dto.templateId && !assignedToId) {
      const template = await this.templates.findOne({
        where: { id: dto.templateId, isActive: true },
      });
      if (template) {
        if (!dueDate && template.defaultDueDays) {
          dueDate = new Date(Date.now() + template.defaultDueDays * 86_400_000)
            .toISOString()
            .slice(0, 10);
        }
        assignedToId = await this.resolveAutoAssign(template, dto.projectId);
      }
    }

    const rfi = await this.rfis.save(
      this.rfis.create({
        projectId: dto.projectId,
        documentId: dto.documentId,
        title: dto.title,
        description: dto.description,
        priority,
        templateId,
        dueDate,
        assignedToId,
        createdById: user.id,
        status: 'open',
      })
    );

    rfi.replyToAddress = this.generateReplyToAddress(rfi.id);
    await this.rfis.save(rfi);

    if (dto.attachments?.length) {
      await this.createAttachments(rfi.id, user.id, dto.attachments);
    }

    await this.logHistory(rfi.id, user.id, 'created', undefined, {
      title: rfi.title,
      status: rfi.status,
      assignedToId: rfi.assignedToId,
      dueDate: rfi.dueDate,
    });

    const notifyRecipients: Array<{ userId: string; email?: string; name?: string }> = [];

    if (rfi.assignedToId && rfi.assignedToId !== user.id) {
      notifyRecipients.push({ userId: rfi.assignedToId });
    }

    if (notifyRecipients.length) {
      await this.notifications.notify({
        recipients: notifyRecipients,
        notificationType: 'rfi_assigned',
        title: 'Nuevo RFI asignado',
        body: `Se te asignó el RFI "${rfi.title}". Puedes responder desde este correo o en Holocron.`,
        entityType: 'rfi',
        entityId: rfi.id,
        category: 'rfi',
        meta: { route: '/rfis', replyTo: rfi.replyToAddress },
        dedupeKey: `rfi-assigned:${rfi.id}:${notifyRecipients.map((r) => r.userId).join(',')}`,
      });
    }

    return this.getDetail(user, rfi.id);
  }

  async addComment(user: RequestUser, rfiId: string, dto: CreateRfiCommentDto) {
    const rfi = await this.assertRfiAccess(user.id, rfiId);
    const comment = await this.comments.save(
      this.comments.create({
        rfiId,
        userId: user.id,
        body: dto.body,
        type: 'comment',
      })
    );

    if (dto.attachments?.length) {
      await this.createAttachments(rfiId, user.id, dto.attachments, comment.id);
    }

    await this.logHistory(rfiId, user.id, 'comment_added', undefined, { body: dto.body });

    if (rfi.assignedToId && rfi.assignedToId !== user.id) {
      await this.notifications.notify({
        recipients: [{ userId: rfi.assignedToId }],
        notificationType: 'rfi_commented',
        title: 'Nuevo comentario en RFI',
        body: `${user.name} comentó en el RFI "${rfi.title}": ${dto.body}`,
        entityType: 'rfi',
        entityId: rfi.id,
        category: 'rfi',
        meta: {
          route: '/rfis',
          replyTo: rfi.replyToAddress,
        },
      });
    }

    return this.getDetail(user, rfiId);
  }

  async respond(user: RequestUser, rfiId: string, dto: RespondRfiDto) {
    const rfi = await this.assertRfiAccess(user.id, rfiId);
    const before = this.snapshot(rfi);

    rfi.answer = dto.answer;
    rfi.status = dto.status ?? 'answered';
    if (this.shouldBeOverdue(rfi.dueDate, rfi.status)) {
      rfi.status = 'overdue';
    }
    rfi.closedAt = undefined;

    await this.rfis.save(rfi);

    const comment = await this.comments.save(
      this.comments.create({
        rfiId,
        userId: user.id,
        body: dto.answer,
        type: 'response',
      })
    );

    if (dto.attachments?.length) {
      await this.createAttachments(rfiId, user.id, dto.attachments, comment.id);
    }

    await this.logHistory(rfiId, user.id, 'responded', before, this.snapshot(rfi));
    if (rfi.createdById !== user.id) {
      await this.notifications.notify({
        recipients: [{ userId: rfi.createdById }],
        notificationType: 'rfi_responded',
        title: 'RFI respondido',
        body: `El RFI "${rfi.title}" recibió una respuesta: ${dto.answer}`,
        entityType: 'rfi',
        entityId: rfi.id,
        category: 'rfi',
        meta: {
          route: '/rfis',
          replyTo: rfi.replyToAddress,
        },
      });
    }

    return this.getDetail(user, rfiId);
  }

  async updateStatus(user: RequestUser, rfiId: string, dto: UpdateRfiStatusDto) {
    const rfi = await this.assertRfiAccess(user.id, rfiId);
    const before = this.snapshot(rfi);

    rfi.status = dto.status;
    rfi.closedAt = dto.status === 'closed' ? new Date() : undefined;
    if (this.shouldBeOverdue(rfi.dueDate, rfi.status)) {
      rfi.status = 'overdue';
      rfi.closedAt = undefined;
    }
    await this.rfis.save(rfi);

    if (dto.note?.trim()) {
      await this.comments.save(
        this.comments.create({
          rfiId,
          userId: user.id,
          body: dto.note,
          type: 'system',
        })
      );
    }

    await this.logHistory(rfiId, user.id, 'status_changed', before, this.snapshot(rfi));
    await this.notifyAssignedOnActivity(
      rfi,
      user.id,
      `El RFI "${rfi.title}" cambió a estado ${rfi.status}.`
    );

    return this.getDetail(user, rfiId);
  }

  async close(user: RequestUser, rfiId: string, note?: string) {
    return this.updateStatus(user, rfiId, { status: 'closed', note });
  }

  // ─── Template CRUD ───────────────────────────────────────────────

  async listTemplates(user: RequestUser, projectId?: string) {
    return this.templates.find({
      where: projectId ? [{ projectId }, { projectId: IsNull() }] : {},
      relations: { project: true, createdBy: true },
      order: { name: 'ASC' },
    });
  }

  async getTemplate(user: RequestUser, id: string) {
    const template = await this.templates.findOne({
      where: { id },
      relations: { project: true, createdBy: true },
    });
    if (!template) {
      throw new NotFoundException('Plantilla no encontrada');
    }
    return template;
  }

  async createTemplate(user: RequestUser, dto: CreateRfiTemplateDto) {
    return this.templates.save(
      this.templates.create({
        ...dto,
        createdById: user.id,
        autoAssignRule: dto.autoAssignRule as unknown as RfiTemplate['autoAssignRule'],
      })
    );
  }

  async updateTemplate(user: RequestUser, id: string, dto: UpdateRfiTemplateDto) {
    const template = await this.templates.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('Plantilla no encontrada');
    }
    Object.assign(template, dto);
    return this.templates.save(template);
  }

  async deleteTemplate(user: RequestUser, id: string) {
    const template = await this.templates.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException('Plantilla no encontrada');
    }
    await this.templates.softRemove(template);
    return { ok: true };
  }

  // ─── Just Go: evaluate template and auto-assign ──────────────────

  async evaluateTemplate(user: RequestUser, templateId: string, projectId: string) {
    const template = await this.templates.findOne({ where: { id: templateId, isActive: true } });
    if (!template) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    const dueDate = template.defaultDueDays
      ? new Date(Date.now() + template.defaultDueDays * 86_400_000).toISOString().slice(0, 10)
      : undefined;

    const assignedToId = await this.resolveAutoAssign(template, projectId);

    const [members, projectDocs] = await Promise.all([
      this.members.find({
        where: { projectId },
        relations: ['user'],
      }),
      this.documents.find({ where: { projectId }, order: { updatedAt: 'DESC' } }),
    ]);

    return {
      template,
      projectId,
      title: template.titleTemplate,
      description: template.descriptionTemplate,
      priority: template.defaultPriority,
      dueDate,
      assignedToId,
      assignedToName: assignedToId
        ? (members.find((m) => m.userId === assignedToId)?.user?.name ?? null)
        : null,
      projectMembers: members
        .filter((m) => m.user)
        .map((m) => ({ id: m.user.id, name: m.user.name, email: m.user.email, role: m.role })),
      documents: projectDocs.map((d) => ({
        id: d.id,
        name: d.name,
        documentNumber: d.documentNumber,
      })),
    };
  }

  private async resolveAutoAssign(
    template: RfiTemplate,
    projectId: string
  ): Promise<string | undefined> {
    const rule = template.autoAssignRule;
    if (!rule) return undefined;

    if (rule.type === 'specific_user' && rule.userId) {
      return rule.userId;
    }

    if (rule.type === 'project_role' && rule.projectRole) {
      const member = await this.members.findOne({
        where: { projectId, role: rule.projectRole! },
        order: { createdAt: 'ASC' },
      });
      if (member) return member.userId;
    }

    if (rule.type === 'discipline_lead' && rule.disciplineId) {
      const project = await this.projects.findOne({ where: { id: projectId } });
      if (project?.responsibleUserId) return project.responsibleUserId;
    }

    if (rule.type === 'document_uploader') {
      const doc = await this.documents.findOne({
        where: { projectId },
        order: { updatedAt: 'DESC' },
      });
      if (doc?.uploadedById) return doc.uploadedById;
    }

    if (rule.fallbackUserId) return rule.fallbackUserId;
    return undefined;
  }

  // ─── Reply-To address generation ───────────────────────────────────

  private generateReplyToAddress(rfiId: string): string {
    const domain = this.config.get<string>('INBOUND_EMAIL_DOMAIN') ?? 'holocron.local';
    const hash = createHash('sha256')
      .update(rfiId + randomBytes(8).toString('hex'))
      .digest('hex')
      .slice(0, 16);
    return `rfi-${hash}@${domain}`;
  }

  // ─── Inbound email processing ──────────────────────────────────────

  async processInboundEmail(dto: InboundEmailDto) {
    const recipientAddress = this.extractEmailAddress(dto.to);
    const senderAddress = this.extractEmailAddress(dto.from);
    const match = recipientAddress.match(/rfi-([a-f0-9]+)@/);
    if (!match) {
      this.logger.warn(`Correo entrante no corresponde a ningún RFI: ${dto.to}`);
      return { ok: false, reason: 'Destino no reconocido' };
    }

    const duplicate = await this.comments.findOne({ where: { emailMessageId: dto.messageId } });
    if (duplicate) {
      return { ok: true, commentId: duplicate.id, duplicate: true };
    }

    const rfi = await this.rfis.findOne({
      where: { replyToAddress: recipientAddress },
      relations: ['project'],
    });
    if (!rfi) {
      this.logger.warn(`RFI no encontrado para dirección: ${recipientAddress}`);
      return { ok: false, reason: 'RFI no encontrado' };
    }

    const sender = await this.users.findOne({ where: { email: senderAddress } });
    if (!sender) {
      this.logger.warn(`Usuario no encontrado para email: ${senderAddress}`);
      return { ok: false, reason: 'Remitente no registrado en Holocron' };
    }

    await this.assertAccess(sender.id, rfi.projectId);
    const before = this.snapshot(rfi);

    const comment = await this.comments.save(
      this.comments.create({
        rfiId: rfi.id,
        userId: sender.id,
        body: dto.body,
        type: 'email',
        emailMessageId: dto.messageId,
        emailInReplyTo: dto.inReplyTo,
      })
    );

    if (rfi.status !== 'closed') {
      rfi.answer = dto.body;
      rfi.status = 'answered';
      rfi.closedAt = undefined;
      await this.rfis.save(rfi);
    }

    await this.logHistory(rfi.id, sender.id, 'email_received', before, {
      commentId: comment.id,
      subject: dto.subject,
      status: rfi.status,
    });

    const notificationUserId = sender.id === rfi.assignedToId ? rfi.createdById : rfi.assignedToId;
    if (notificationUserId && notificationUserId !== sender.id) {
      await this.notifications.notify({
        recipients: [{ userId: notificationUserId }],
        notificationType: 'rfi_responded',
        title: 'Respuesta por correo recibida',
        body: `${sender.name} respondió al RFI "${rfi.title}" desde el correo.`,
        entityType: 'rfi',
        entityId: rfi.id,
        category: 'rfi',
        meta: { route: '/rfis' },
      });
    }

    return { ok: true, commentId: comment.id };
  }

  private extractEmailAddress(value: string) {
    const bracketed = value.match(/<([^>]+)>/);
    return (bracketed?.[1] ?? value).trim().toLowerCase();
  }

  private async assertAccess(userId: string, projectId: string) {
    if (!(await this.scope.canAccessProject(userId, projectId))) {
      throw new ForbiddenException('No tienes acceso a este centro de costos');
    }
  }

  private async assertRfiAccess(userId: string, rfiId: string) {
    const rfi = await this.rfis.findOne({ where: { id: rfiId } });
    if (!rfi) {
      throw new NotFoundException('RFI no encontrado');
    }
    await this.assertAccess(userId, rfi.projectId);
    if (this.shouldBeOverdue(rfi.dueDate, rfi.status)) {
      rfi.status = 'overdue';
      rfi.closedAt = undefined;
      await this.rfis.save(rfi);
      await this.logHistory(rfi.id, undefined, 'auto_overdue', undefined, { status: 'overdue' });
    }
    return rfi;
  }

  private async resolveVisibleProjectIds(userId: string, projectId?: string) {
    if (projectId) {
      await this.assertAccess(userId, projectId);
      return [projectId];
    }
    return this.scope.visibleProjectIdsForUser(userId);
  }

  private async assertAssignment(projectId: string, assignedToId?: string) {
    if (!assignedToId) return;
    const count = await this.members.count({ where: { projectId, userId: assignedToId } });
    if (!count) {
      throw new NotFoundException('El responsable asignado no pertenece al centro de costos');
    }
  }

  private async assertDocument(projectId: string, documentId?: string) {
    if (!documentId) return;
    const document = await this.documents.findOne({ where: { id: documentId } });
    if (!document || document.projectId !== projectId) {
      throw new NotFoundException('El documento relacionado no pertenece al centro de costos');
    }
  }

  private async loadRfiWithRelations(id: string) {
    return this.rfis.findOne({
      where: { id },
      relations: {
        project: true,
        document: true,
        requester: true,
        assignedTo: true,
        template: true,
        attachments: { uploadedBy: true },
        comments: { author: true, attachments: { uploadedBy: true } },
        history: { actor: true },
      },
    });
  }

  private serializeListItem(rfi: Rfi, includeDocument: boolean) {
    const commentsCount = rfi.comments?.length ?? 0;
    const attachmentsCount = rfi.attachments?.length ?? 0;
    return {
      id: rfi.id,
      projectId: rfi.projectId,
      documentId: rfi.documentId,
      title: rfi.title,
      description: rfi.description,
      answer: rfi.answer,
      priority: rfi.priority,
      dueDate: rfi.dueDate,
      status: rfi.status,
      closedAt: rfi.closedAt,
      createdAt: rfi.createdAt,
      updatedAt: rfi.updatedAt,
      replyToAddress: rfi.replyToAddress,
      requester: rfi.requester
        ? { id: rfi.requester.id, name: rfi.requester.name, email: rfi.requester.email }
        : null,
      assignedTo: rfi.assignedTo
        ? { id: rfi.assignedTo.id, name: rfi.assignedTo.name, email: rfi.assignedTo.email }
        : null,
      project: rfi.project
        ? { id: rfi.project.id, name: rfi.project.name, code: rfi.project.code }
        : null,
      document:
        includeDocument && rfi.document
          ? {
              id: rfi.document.id,
              name: rfi.document.name,
              documentNumber: rfi.document.documentNumber,
            }
          : null,
      template: rfi.template ? { id: rfi.template.id, name: rfi.template.name } : null,
      commentsCount,
      attachmentsCount,
    };
  }

  private serializeDetail(rfi: Rfi, includeDocument: boolean) {
    return {
      ...this.serializeListItem(rfi, includeDocument),
      comments: (rfi.comments ?? [])
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .map((comment) => ({
          id: comment.id,
          body: comment.body,
          type: comment.type,
          createdAt: comment.createdAt,
          author: comment.author
            ? { id: comment.author.id, name: comment.author.name, email: comment.author.email }
            : null,
          emailMessageId: comment.emailMessageId,
          emailInReplyTo: comment.emailInReplyTo,
          attachments: (comment.attachments ?? []).map((attachment) =>
            this.serializeAttachment(attachment)
          ),
        })),
      attachments: (rfi.attachments ?? [])
        .filter((attachment) => !attachment.commentId)
        .map((attachment) => this.serializeAttachment(attachment)),
      history: (rfi.history ?? [])
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map((item) => ({
          id: item.id,
          action: item.action,
          beforeState: item.beforeState,
          afterState: item.afterState,
          createdAt: item.createdAt,
          actor: item.actor
            ? { id: item.actor.id, name: item.actor.name, email: item.actor.email }
            : null,
        })),
    };
  }

  private serializeAttachment(attachment: RfiAttachment) {
    return {
      id: attachment.id,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      sizeBytes: Number(attachment.sizeBytes),
      createdAt: attachment.createdAt,
      uploadedBy: attachment.uploadedBy
        ? {
            id: attachment.uploadedBy.id,
            name: attachment.uploadedBy.name,
            email: attachment.uploadedBy.email,
          }
        : null,
    };
  }

  private async createAttachments(
    rfiId: string,
    userId: string,
    files: RfiAttachmentInputDto[],
    commentId?: string
  ) {
    for (const file of files) {
      const cleanBase64 = file.base64Content.includes(',')
        ? file.base64Content.split(',')[1]
        : file.base64Content;
      const buffer = Buffer.from(cleanBase64, 'base64');
      const stored = await this.storage.put(buffer, file.fileName, file.mimeType);
      await this.attachments.save(
        this.attachments.create({
          rfiId,
          commentId,
          fileKey: stored.fileKey,
          fileName: stored.fileName,
          mimeType: stored.mimeType,
          sizeBytes: stored.sizeBytes,
          uploadedById: userId,
        })
      );
    }
  }

  private async logHistory(
    rfiId: string,
    actorId: string | undefined,
    action: string,
    beforeState?: Record<string, unknown>,
    afterState?: Record<string, unknown>
  ) {
    await this.history.save(
      this.history.create({
        rfiId,
        actorId,
        action,
        beforeState,
        afterState,
      })
    );
  }

  private snapshot(rfi: Rfi) {
    return {
      title: rfi.title,
      description: rfi.description,
      answer: rfi.answer,
      priority: rfi.priority,
      dueDate: rfi.dueDate,
      status: rfi.status,
      assignedToId: rfi.assignedToId,
      documentId: rfi.documentId,
      closedAt: rfi.closedAt?.toISOString() ?? null,
    };
  }

  private shouldBeOverdue(dueDate: string | undefined, status: Rfi['status']) {
    if (!dueDate || status === 'closed' || status === 'overdue') {
      return false;
    }

    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const due = new Date(`${dueDate}T00:00:00`);
    return due.getTime() < start.getTime();
  }

  private async markOverdue(projectIds?: string[]) {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const overdue = await this.rfis.find({
      where: {
        dueDate: LessThan(start.toISOString().slice(0, 10)),
        status: Not(In(['closed', 'overdue'])),
        ...(projectIds?.length ? { projectId: In(projectIds) } : {}),
      },
    });

    for (const rfi of overdue) {
      rfi.status = 'overdue';
      rfi.closedAt = undefined;
      await this.rfis.save(rfi);
      await this.logHistory(rfi.id, undefined, 'auto_overdue', undefined, { status: 'overdue' });
    }
  }

  private async notifyAssignedOnActivity(rfi: Rfi, actorId: string, body: string) {
    if (!rfi.assignedToId || rfi.assignedToId === actorId) {
      return;
    }

    await this.notifications.notify({
      recipients: [{ userId: rfi.assignedToId }],
      notificationType: 'rfi_assigned',
      title: 'Actualización de RFI',
      body,
      entityType: 'rfi',
      entityId: rfi.id,
      category: 'rfi',
      meta: { route: '/rfis' },
    });
  }
}
