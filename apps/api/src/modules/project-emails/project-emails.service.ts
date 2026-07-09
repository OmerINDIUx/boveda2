import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { ProjectEmail } from './project-email.entity';
import { ProjectEmailThread } from './project-email-thread.entity';
import { ProjectEmailAddress } from './project-email-address.entity';
import { ProjectEmailAttachment } from './project-email-attachment.entity';
import { InboundProjectEmailDto, SendProjectEmailDto } from './dto/inbound-project-email.dto';
import { StorageService } from '../../storage/storage.service';
import { Project } from '../projects/project.entity';

@Injectable()
export class ProjectEmailsService {
  private readonly logger = new Logger(ProjectEmailsService.name);

  constructor(
    @InjectRepository(ProjectEmail)
    private readonly emails: Repository<ProjectEmail>,
    @InjectRepository(ProjectEmailThread)
    private readonly threads: Repository<ProjectEmailThread>,
    @InjectRepository(ProjectEmailAddress)
    private readonly addresses: Repository<ProjectEmailAddress>,
    @InjectRepository(ProjectEmailAttachment)
    private readonly attachments: Repository<ProjectEmailAttachment>,
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
    private readonly config: ConfigService,
    private readonly storage: StorageService
  ) {}

  async listThreads(projectId: string) {
    return this.threads.find({
      where: { projectId, isArchived: false },
      order: { lastEmailAt: 'DESC' },
      relations: ['emails'],
    });
  }

  async getThread(threadId: string) {
    const thread = await this.threads.findOne({
      where: { id: threadId },
      relations: ['emails', 'emails.attachments'],
    });
    if (!thread) throw new NotFoundException('Hilo de correo no encontrado');
    return thread;
  }

  async getEmail(emailId: string) {
    const email = await this.emails.findOne({
      where: { id: emailId },
      relations: ['attachments'],
    });
    if (!email) throw new NotFoundException('Correo no encontrado');
    return email;
  }

  async markAsRead(emailId: string) {
    await this.emails.update(emailId, { isRead: true });
    return { ok: true };
  }

  async archiveThread(threadId: string) {
    await this.threads.update(threadId, { isArchived: true });
    return { ok: true };
  }

  async processInboundEmail(dto: InboundProjectEmailDto) {
    const address = await this.addresses.findOne({
      where: { emailAddress: dto.to, isActive: true },
      relations: ['project'],
    });
    if (!address) {
      this.logger.warn(`Correo recibido para dirección desconocida: ${dto.to}`);
      return { ok: false, reason: 'Dirección no registrada' };
    }

    const projectId = address.projectId;

    let thread: ProjectEmailThread | null = null;
    if (dto.inReplyTo) {
      const parentEmail = await this.emails.findOne({
        where: { messageId: dto.inReplyTo },
      });
      if (parentEmail?.threadId) {
        thread = await this.threads.findOne({ where: { id: parentEmail.threadId } });
      }
    }

    if (!thread) {
      thread = this.threads.create({
        projectId,
        subjectClean: dto.subject.replace(/^(Re|Fwd):\s*/i, ''),
        lastEmailAt: new Date(),
        emailCount: 0,
      });
      thread = await this.threads.save(thread);
    }

    const email = this.emails.create({
      projectId,
      threadId: thread.id,
      emailAddressId: address.id,
      fromAddress: dto.from,
      fromName: dto.fromName,
      toAddress: dto.to,
      subject: dto.subject,
      bodyText: dto.body,
      bodyHtml: dto.bodyHtml,
      messageId: dto.messageId,
      inReplyTo: dto.inReplyTo,
      referencesHeader: dto.references,
      isInternal: true,
      receivedAt: new Date(),
    });
    const saved = await this.emails.save(email);

    if (dto.attachments?.length) {
      for (const att of dto.attachments) {
        const fileName = att.fileName;
        const buffer = Buffer.from(att.contentBase64, 'base64');
        const stored = await this.storage.put(buffer, fileName, att.mimeType);
        await this.attachments.save(
          this.attachments.create({
            emailId: saved.id,
            fileKey: stored.fileKey,
            fileName: stored.fileName,
            mimeType: stored.mimeType,
            sizeBytes: stored.sizeBytes,
          })
        );
      }
    }

    thread.emailCount += 1;
    thread.lastEmailAt = new Date();
    await this.threads.save(thread);

    return { ok: true, emailId: saved.id, threadId: thread.id };
  }

  async sendEmail(dto: SendProjectEmailDto) {
    const project = await this.projects.findOne({ where: { id: dto.projectId } });
    if (!project) throw new NotFoundException('Proyecto no encontrado');

    const address = await this.addresses.findOne({
      where: { projectId: dto.projectId, isActive: true },
    });

    const fromAddress =
      address?.emailAddress ??
      `${project.code}@${this.config.get<string>('INBOUND_EMAIL_DOMAIN', 'holocron.local')}`;

    const thread = this.threads.create({
      projectId: dto.projectId,
      subjectClean: dto.subject.replace(/^(Re|Fwd):\s*/i, ''),
      lastEmailAt: new Date(),
      emailCount: 1,
    });
    const savedThread = await this.threads.save(thread);

    const email = this.emails.create({
      projectId: dto.projectId,
      threadId: savedThread.id,
      fromAddress,
      toAddress: dto.to,
      cc: dto.cc,
      subject: dto.subject,
      bodyText: dto.body,
      bodyHtml: dto.bodyHtml,
      isInternal: false,
      receivedAt: new Date(),
    });
    const saved = await this.emails.save(email);

    return { ok: true, emailId: saved.id, threadId: savedThread.id };
  }
}
