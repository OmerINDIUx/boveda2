import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, IsNull, LessThan, Not, Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { DocumentRecord } from '../documents/document.entity';
import { ApprovalRequest } from '../approvals/approval-request.entity';
import { ApprovalStep } from '../approvals/approval-step.entity';
import { Contract } from '../clm/contract.entity';
import { ContractObligation } from '../clm/contract-obligation.entity';
import { Rfi } from '../rfis/rfi.entity';
import { NotificationDelivery } from './notification-delivery.entity';
import { NotificationPreference } from './notification-preference.entity';
import { Notification } from './notification.entity';
import {
  NOTIFICATION_DEFAULTS,
  NOTIFICATION_TYPES,
  NotificationType,
} from './notifications.constants';
import { SmtpMailService } from './smtp-mail.service';

type NotificationRecipient = {
  userId: string;
  email?: string;
  name?: string;
};

type NotificationMeta = {
  route?: string;
  [key: string]: unknown;
};

type NotifyPayload = {
  recipients: NotificationRecipient[];
  notificationType: NotificationType;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
  category?: string;
  meta?: NotificationMeta;
  dedupeKey?: string;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification) private readonly notifications: Repository<Notification>,
    @InjectRepository(NotificationPreference)
    private readonly preferences: Repository<NotificationPreference>,
    @InjectRepository(NotificationDelivery)
    private readonly deliveries: Repository<NotificationDelivery>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(DocumentRecord) private readonly documents: Repository<DocumentRecord>,
    @InjectRepository(ApprovalRequest)
    private readonly approvalRequests: Repository<ApprovalRequest>,
    @InjectRepository(ApprovalStep) private readonly approvalSteps: Repository<ApprovalStep>,
    @InjectRepository(Contract) private readonly contracts: Repository<Contract>,
    @InjectRepository(ContractObligation)
    private readonly obligations: Repository<ContractObligation>,
    @InjectRepository(Rfi) private readonly rfis: Repository<Rfi>,
    private readonly mailer: SmtpMailService,
    private readonly config: ConfigService
  ) {}

  async listForUser(userId: string) {
    const rows = await this.notifications.find({ where: { userId }, order: { createdAt: 'DESC' } });
    return rows.map((row) => this.serialize(row));
  }

  unreadCount(userId: string) {
    return this.notifications.count({ where: { userId, readAt: IsNull() } });
  }

  async markAsRead(userId: string, id: string) {
    const notification = await this.notifications.findOne({ where: { id, userId } });
    if (!notification) {
      return { ok: false };
    }
    notification.readAt = notification.readAt ?? new Date();
    await this.notifications.save(notification);
    return { ok: true };
  }

  async markAllAsRead(userId: string) {
    const rows = await this.notifications.find({ where: { userId, readAt: IsNull() } });
    const now = new Date();
    for (const row of rows) {
      row.readAt = now;
    }
    if (rows.length) {
      await this.notifications.save(rows);
    }
    return { ok: true, updated: rows.length };
  }

  async listPreferences(userId: string) {
    const rows = await this.preferences.find({ where: { userId } });
    const map = new Map(rows.map((row) => [row.notificationType, row]));
    return NOTIFICATION_TYPES.map((notificationType) => {
      const row = map.get(notificationType);
      const defaults = NOTIFICATION_DEFAULTS[notificationType];
      return {
        notificationType,
        label: defaults.label,
        inAppEnabled: row?.inAppEnabled ?? defaults.inApp,
        emailEnabled: row?.emailEnabled ?? defaults.email,
      };
    });
  }

  async updatePreferences(
    userId: string,
    items: Array<{ notificationType: string; inAppEnabled: boolean; emailEnabled: boolean }>
  ) {
    const existing = await this.preferences.find({
      where: { userId, notificationType: In(items.map((item) => item.notificationType)) },
    });
    const existingMap = new Map(existing.map((row) => [row.notificationType, row]));
    const rows = items.map((item) => {
      const current = existingMap.get(item.notificationType);
      return this.preferences.create({
        id: current?.id,
        userId,
        notificationType: item.notificationType,
        inAppEnabled: item.inAppEnabled,
        emailEnabled: item.emailEnabled,
      });
    });
    await this.preferences.save(rows);
    return this.listPreferences(userId);
  }

  async create(
    userId: string,
    title: string,
    body: string,
    meta?: {
      type?: string;
      entityType?: string;
      entityId?: string;
      notificationType?: NotificationType;
      route?: string;
    }
  ) {
    await this.notify({
      recipients: [{ userId }],
      notificationType: meta?.notificationType ?? 'document_new_version',
      title,
      body,
      entityType: meta?.entityType,
      entityId: meta?.entityId,
      category: meta?.type,
      meta: meta?.route ? { route: meta.route } : undefined,
    });
  }

  async notify(payload: NotifyPayload) {
    const uniqueRecipients = new Map<string, NotificationRecipient>();
    for (const recipient of payload.recipients) {
      if (recipient.userId) {
        uniqueRecipients.set(recipient.userId, recipient);
      }
    }
    if (!uniqueRecipients.size) {
      return { delivered: 0, skipped: 0 };
    }

    const users = await this.users.find({
      where: { id: In([...uniqueRecipients.keys()]), active: true },
    });
    const preferences = await this.preferences.find({
      where: { userId: In(users.map((user) => user.id)) },
    });
    const preferenceMap = new Map<string, NotificationPreference>();
    for (const row of preferences) {
      preferenceMap.set(`${row.userId}:${row.notificationType}`, row);
    }

    let delivered = 0;
    let skipped = 0;
    for (const user of users) {
      const preference = preferenceMap.get(`${user.id}:${payload.notificationType}`);
      const defaults = NOTIFICATION_DEFAULTS[payload.notificationType];
      const inAppEnabled = preference?.inAppEnabled ?? defaults.inApp;
      const emailEnabled = preference?.emailEnabled ?? defaults.email;

      if (inAppEnabled) {
        const deduped = await this.registerDelivery(user.id, 'in_app', payload, 'sent');
        if (!deduped) {
          await this.notifications.save(
            this.notifications.create({
              userId: user.id,
              title: payload.title,
              body: payload.body,
              type: payload.category ?? 'system',
              notificationType: payload.notificationType,
              entityType: payload.entityType,
              entityId: payload.entityId,
              metaJson: payload.meta ? JSON.stringify(payload.meta) : undefined,
            })
          );
          delivered += 1;
        } else {
          skipped += 1;
        }
      }

      if (emailEnabled && user.email) {
        const deduped = await this.registerDelivery(user.id, 'email', payload, 'sent');
        if (deduped) {
          skipped += 1;
          continue;
        }

        try {
          const result = await this.mailer.send({
            to: user.email,
            subject: payload.title,
            text: `${payload.title}\n\n${payload.body}`,
            html: this.buildEmailHtml(user.name, payload),
            replyTo: typeof payload.meta?.replyTo === 'string' ? payload.meta.replyTo : undefined,
          });
          if (result.status === 'skipped') {
            await this.updateDeliveryStatus(
              user.id,
              'email',
              payload.dedupeKey,
              'skipped',
              result.message
            );
            skipped += 1;
          } else {
            delivered += 1;
          }
        } catch (error) {
          await this.updateDeliveryStatus(
            user.id,
            'email',
            payload.dedupeKey,
            'failed',
            error instanceof Error ? error.message : 'Fallo inesperado'
          );
          this.logger.error(
            `No fue posible enviar correo a ${user.email}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }
    }

    return { delivered, skipped };
  }

  async runDailyChecks() {
    const documents = await this.processDocumentDueDates();
    const contracts = await this.processContractDueDates();
    const approvals = await this.processStoppedFlows();
    const rfis = await this.processOverdueRfis();
    const obligations = await this.processPendingObligations();

    return { ok: true, documents, contracts, approvals, rfis, obligations };
  }

  private async processDocumentDueDates() {
    const today = this.today();
    const soon = this.addDays(today, 7);
    const expiring = await this.documents.find({
      where: {
        dueDate: Between(today, soon),
        status: Not(In(['approved', 'archived', 'expired'])),
      },
      relations: ['responsibleUser', 'uploadedBy'],
    });
    const expired = await this.documents.find({
      where: {
        dueDate: LessThan(today),
        status: Not(In(['archived', 'expired'])),
      },
      relations: ['responsibleUser', 'uploadedBy'],
    });

    for (const document of expired) {
      if (document.status !== 'expired') {
        document.status = 'expired';
        await this.documents.save(document);
      }
      await this.notify({
        recipients: this.toRecipients([document.responsibleUser, document.uploadedBy]),
        notificationType: 'document_expired',
        title: `Documento vencido: ${document.name}`,
        body: `El documento ${document.documentNumber} venció el ${document.dueDate ?? 'sin fecha registrada'}.`,
        entityType: 'document',
        entityId: document.id,
        category: 'document',
        meta: { route: '/documents' },
        dedupeKey: `document-expired:${document.id}:${today}`,
      });
    }

    for (const document of expiring) {
      await this.notify({
        recipients: this.toRecipients([document.responsibleUser, document.uploadedBy]),
        notificationType: 'document_expiring_soon',
        title: `Documento próximo a vencer: ${document.name}`,
        body: `El documento ${document.documentNumber} vence el ${document.dueDate ?? 'sin fecha registrada'}.`,
        entityType: 'document',
        entityId: document.id,
        category: 'document',
        meta: { route: '/documents' },
        dedupeKey: `document-soon:${document.id}:${today}`,
      });
    }

    return { expiring: expiring.length, expired: expired.length };
  }

  private async processContractDueDates() {
    const today = this.today();
    const soon = this.addDays(today, 30);
    const expiring = await this.contracts.find({
      where: {
        endDate: Between(today, soon),
        status: Not(In(['expired', 'closed', 'renewed'])),
      },
      relations: ['responsibleUser'],
    });
    const expired = await this.contracts.find({
      where: {
        endDate: LessThan(today),
        status: Not(In(['expired', 'closed', 'renewed'])),
      },
      relations: ['responsibleUser'],
    });

    for (const contract of expired) {
      contract.status = 'expired';
      await this.contracts.save(contract);
      await this.notify({
        recipients: this.toRecipients([contract.responsibleUser]),
        notificationType: 'contract_expired',
        title: `Contrato vencido: ${contract.name}`,
        body: `El contrato ${contract.name} venció el ${contract.endDate ?? 'sin fecha registrada'}.`,
        entityType: 'contract',
        entityId: contract.id,
        category: 'contract',
        meta: { route: '/clm' },
        dedupeKey: `contract-expired:${contract.id}:${today}`,
      });
    }

    for (const contract of expiring) {
      await this.notify({
        recipients: this.toRecipients([contract.responsibleUser]),
        notificationType: 'contract_expiring_soon',
        title: `Contrato próximo a vencer: ${contract.name}`,
        body: `El contrato ${contract.name} vence el ${contract.endDate ?? 'sin fecha registrada'}.`,
        entityType: 'contract',
        entityId: contract.id,
        category: 'contract',
        meta: { route: '/clm' },
        dedupeKey: `contract-soon:${contract.id}:${today}`,
      });
    }

    return { expiring: expiring.length, expired: expired.length };
  }

  private async processStoppedFlows() {
    const stopped = await this.approvalRequests.find({
      where: {
        status: 'stopped',
        completedAt: MoreThanDate(this.daysAgo(1)),
      },
    });

    for (const request of stopped) {
      await this.notify({
        recipients: [{ userId: request.requesterId }],
        notificationType: 'approval_stopped',
        title: 'Flujo de aprobación detenido',
        body: `La solicitud de aprobación ${request.id} se encuentra detenida y requiere seguimiento.`,
        entityType: request.entityType,
        entityId: request.entityId,
        category: 'approval',
        meta: { route: '/approvals' },
        dedupeKey: `approval-stopped:${request.id}`,
      });
    }

    return { stopped: stopped.length };
  }

  private async processOverdueRfis() {
    const today = this.today();
    const overdue = await this.rfis.find({
      where: {
        dueDate: LessThan(today),
        status: Not(In(['closed', 'overdue'])),
      },
      relations: ['assignedTo', 'requester'],
    });

    for (const rfi of overdue) {
      rfi.status = 'overdue';
      rfi.closedAt = undefined;
      await this.rfis.save(rfi);
      await this.notify({
        recipients: this.toRecipients([rfi.assignedTo, rfi.requester]),
        notificationType: 'rfi_overdue',
        title: `RFI vencido: ${rfi.title}`,
        body: `El RFI ${rfi.title} superó su fecha compromiso ${rfi.dueDate ?? 'sin fecha registrada'}.`,
        entityType: 'rfi',
        entityId: rfi.id,
        category: 'rfi',
        meta: { route: '/rfis' },
        dedupeKey: `rfi-overdue:${rfi.id}:${today}`,
      });
    }

    return { overdue: overdue.length };
  }

  private async processPendingObligations() {
    const today = this.today();
    const pending = await this.obligations.find({
      where: {
        commitmentDate: LessThan(this.addDays(today, 7)),
        status: Not(In(['completed', 'waived'])),
      },
      relations: ['responsibleUser', 'contract'],
    });

    for (const obligation of pending) {
      await this.notify({
        recipients: this.toRecipients([obligation.responsibleUser]),
        notificationType: 'contract_obligation_pending',
        title: 'Obligación contractual pendiente',
        body: `La obligación "${obligation.description}" del contrato ${obligation.contract?.name ?? ''} tiene compromiso ${obligation.commitmentDate ?? 'sin fecha registrada'}.`,
        entityType: 'contract_obligation',
        entityId: obligation.id,
        category: 'contract',
        meta: { route: '/clm' },
        dedupeKey: `contract-obligation:${obligation.id}:${today}`,
      });
    }

    return { pending: pending.length };
  }

  async resolveApprovalRecipients(step: ApprovalStep | null | undefined) {
    if (!step) {
      return [];
    }

    if (step.approverUserId) {
      const user = await this.users.findOne({ where: { id: step.approverUserId, active: true } });
      return this.toRecipients(user ? [user] : []);
    }

    if (step.approverRoleId) {
      const users = await this.users.find({ relations: ['roles'], where: { active: true } });
      return this.toRecipients(
        users.filter((user) => user.roles?.some((role) => role.id === step.approverRoleId))
      );
    }

    return [];
  }

  private async registerDelivery(
    userId: string,
    channel: 'in_app' | 'email',
    payload: NotifyPayload,
    status: NotificationDelivery['status']
  ) {
    if (!payload.dedupeKey) {
      await this.deliveries.save(
        this.deliveries.create({
          userId,
          channel,
          status,
          subject: payload.title,
          notificationType: payload.notificationType,
          entityType: payload.entityType,
          entityId: payload.entityId,
        })
      );
      return false;
    }

    const existing = await this.deliveries.findOne({
      where: { userId, channel, dedupeKey: payload.dedupeKey },
    });
    if (existing) {
      return true;
    }

    await this.deliveries.save(
      this.deliveries.create({
        userId,
        channel,
        status,
        subject: payload.title,
        notificationType: payload.notificationType,
        entityType: payload.entityType,
        entityId: payload.entityId,
        dedupeKey: payload.dedupeKey,
      })
    );
    return false;
  }

  private async updateDeliveryStatus(
    userId: string,
    channel: 'in_app' | 'email',
    dedupeKey: string | undefined,
    status: NotificationDelivery['status'],
    errorMessage?: string
  ) {
    if (!dedupeKey) {
      return;
    }
    const delivery = await this.deliveries.findOne({ where: { userId, channel, dedupeKey } });
    if (!delivery) {
      return;
    }
    delivery.status = status;
    delivery.errorMessage = errorMessage;
    await this.deliveries.save(delivery);
  }

  private serialize(notification: Notification) {
    return {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      notificationType: notification.notificationType,
      entityType: notification.entityType,
      entityId: notification.entityId,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      meta: notification.metaJson ? JSON.parse(notification.metaJson) : null,
    };
  }

  private buildEmailHtml(name: string, payload: NotifyPayload) {
    const appUrl =
      this.config.get<string>('WEB_APP_URL') ?? this.config.get<string>('WEB_ORIGIN') ?? '';
    const route = payload.meta?.route ? `${appUrl}${payload.meta.route}` : '';
    return [
      `<div style="font-family:Segoe UI,Arial,sans-serif;color:#172033;line-height:1.5">`,
      `<p>Hola ${name},</p>`,
      `<h2 style="margin:0 0 12px;color:#0f766e">${payload.title}</h2>`,
      `<p>${payload.body}</p>`,
      route ? `<p><a href="${route}" style="color:#0f766e">Abrir en Holocron</a></p>` : '',
      `<p style="color:#667085;font-size:12px">Este aviso fue generado por Holocron.</p>`,
      `</div>`,
    ].join('');
  }

  private toRecipients(users: Array<Pick<User, 'id' | 'email' | 'name'> | null | undefined>) {
    return users
      .filter((user): user is Pick<User, 'id' | 'email' | 'name'> => Boolean(user?.id))
      .map((user) => ({ userId: user.id, email: user.email, name: user.name }));
  }

  private today() {
    return new Date().toISOString().slice(0, 10);
  }

  private addDays(base: string, days: number) {
    const date = new Date(`${base}T00:00:00`);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  private daysAgo(days: number) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }
}

function MoreThanDate(value: Date) {
  return Not(LessThan(value));
}
