"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const document_entity_1 = require("../documents/document.entity");
const approval_request_entity_1 = require("../approvals/approval-request.entity");
const approval_step_entity_1 = require("../approvals/approval-step.entity");
const contract_entity_1 = require("../clm/contract.entity");
const contract_obligation_entity_1 = require("../clm/contract-obligation.entity");
const rfi_entity_1 = require("../rfis/rfi.entity");
const notification_delivery_entity_1 = require("./notification-delivery.entity");
const notification_preference_entity_1 = require("./notification-preference.entity");
const notification_entity_1 = require("./notification.entity");
const notifications_constants_1 = require("./notifications.constants");
const smtp_mail_service_1 = require("./smtp-mail.service");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    notifications;
    preferences;
    deliveries;
    users;
    documents;
    approvalRequests;
    approvalSteps;
    contracts;
    obligations;
    rfis;
    mailer;
    config;
    logger = new common_1.Logger(NotificationsService_1.name);
    constructor(notifications, preferences, deliveries, users, documents, approvalRequests, approvalSteps, contracts, obligations, rfis, mailer, config) {
        this.notifications = notifications;
        this.preferences = preferences;
        this.deliveries = deliveries;
        this.users = users;
        this.documents = documents;
        this.approvalRequests = approvalRequests;
        this.approvalSteps = approvalSteps;
        this.contracts = contracts;
        this.obligations = obligations;
        this.rfis = rfis;
        this.mailer = mailer;
        this.config = config;
    }
    async listForUser(userId) {
        const rows = await this.notifications.find({ where: { userId }, order: { createdAt: 'DESC' } });
        return rows.map((row) => this.serialize(row));
    }
    unreadCount(userId) {
        return this.notifications.count({ where: { userId, readAt: (0, typeorm_2.IsNull)() } });
    }
    async markAsRead(userId, id) {
        const notification = await this.notifications.findOne({ where: { id, userId } });
        if (!notification) {
            return { ok: false };
        }
        notification.readAt = notification.readAt ?? new Date();
        await this.notifications.save(notification);
        return { ok: true };
    }
    async markAllAsRead(userId) {
        const rows = await this.notifications.find({ where: { userId, readAt: (0, typeorm_2.IsNull)() } });
        const now = new Date();
        for (const row of rows) {
            row.readAt = now;
        }
        if (rows.length) {
            await this.notifications.save(rows);
        }
        return { ok: true, updated: rows.length };
    }
    async listPreferences(userId) {
        const rows = await this.preferences.find({ where: { userId } });
        const map = new Map(rows.map((row) => [row.notificationType, row]));
        return notifications_constants_1.NOTIFICATION_TYPES.map((notificationType) => {
            const row = map.get(notificationType);
            const defaults = notifications_constants_1.NOTIFICATION_DEFAULTS[notificationType];
            return {
                notificationType,
                label: defaults.label,
                inAppEnabled: row?.inAppEnabled ?? defaults.inApp,
                emailEnabled: row?.emailEnabled ?? defaults.email
            };
        });
    }
    async updatePreferences(userId, items) {
        const existing = await this.preferences.find({ where: { userId, notificationType: (0, typeorm_2.In)(items.map((item) => item.notificationType)) } });
        const existingMap = new Map(existing.map((row) => [row.notificationType, row]));
        const rows = items.map((item) => {
            const current = existingMap.get(item.notificationType);
            return this.preferences.create({
                id: current?.id,
                userId,
                notificationType: item.notificationType,
                inAppEnabled: item.inAppEnabled,
                emailEnabled: item.emailEnabled
            });
        });
        await this.preferences.save(rows);
        return this.listPreferences(userId);
    }
    async create(userId, title, body, meta) {
        await this.notify({
            recipients: [{ userId }],
            notificationType: meta?.notificationType ?? 'document_new_version',
            title,
            body,
            entityType: meta?.entityType,
            entityId: meta?.entityId,
            category: meta?.type,
            meta: meta?.route ? { route: meta.route } : undefined
        });
    }
    async notify(payload) {
        const uniqueRecipients = new Map();
        for (const recipient of payload.recipients) {
            if (recipient.userId) {
                uniqueRecipients.set(recipient.userId, recipient);
            }
        }
        if (!uniqueRecipients.size) {
            return { delivered: 0, skipped: 0 };
        }
        const users = await this.users.find({ where: { id: (0, typeorm_2.In)([...uniqueRecipients.keys()]), active: true } });
        const preferences = await this.preferences.find({ where: { userId: (0, typeorm_2.In)(users.map((user) => user.id)) } });
        const preferenceMap = new Map();
        for (const row of preferences) {
            preferenceMap.set(`${row.userId}:${row.notificationType}`, row);
        }
        let delivered = 0;
        let skipped = 0;
        for (const user of users) {
            const preference = preferenceMap.get(`${user.id}:${payload.notificationType}`);
            const defaults = notifications_constants_1.NOTIFICATION_DEFAULTS[payload.notificationType];
            const inAppEnabled = preference?.inAppEnabled ?? defaults.inApp;
            const emailEnabled = preference?.emailEnabled ?? defaults.email;
            if (inAppEnabled) {
                const deduped = await this.registerDelivery(user.id, 'in_app', payload, 'sent');
                if (!deduped) {
                    await this.notifications.save(this.notifications.create({
                        userId: user.id,
                        title: payload.title,
                        body: payload.body,
                        type: payload.category ?? 'system',
                        notificationType: payload.notificationType,
                        entityType: payload.entityType,
                        entityId: payload.entityId,
                        metaJson: payload.meta ? JSON.stringify(payload.meta) : undefined
                    }));
                    delivered += 1;
                }
                else {
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
                        html: this.buildEmailHtml(user.name, payload)
                    });
                    if (result.status === 'skipped') {
                        await this.updateDeliveryStatus(user.id, 'email', payload.dedupeKey, 'skipped', result.message);
                        skipped += 1;
                    }
                    else {
                        delivered += 1;
                    }
                }
                catch (error) {
                    await this.updateDeliveryStatus(user.id, 'email', payload.dedupeKey, 'failed', error instanceof Error ? error.message : 'Fallo inesperado');
                    this.logger.error(`No fue posible enviar correo a ${user.email}: ${error instanceof Error ? error.message : String(error)}`);
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
    async processDocumentDueDates() {
        const today = this.today();
        const soon = this.addDays(today, 7);
        const expiring = await this.documents.find({
            where: {
                dueDate: (0, typeorm_2.Between)(today, soon),
                status: (0, typeorm_2.Not)((0, typeorm_2.In)(['approved', 'archived', 'expired']))
            },
            relations: ['responsibleUser', 'uploadedBy']
        });
        const expired = await this.documents.find({
            where: {
                dueDate: (0, typeorm_2.LessThan)(today),
                status: (0, typeorm_2.Not)((0, typeorm_2.In)(['archived', 'expired']))
            },
            relations: ['responsibleUser', 'uploadedBy']
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
                dedupeKey: `document-expired:${document.id}:${today}`
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
                dedupeKey: `document-soon:${document.id}:${today}`
            });
        }
        return { expiring: expiring.length, expired: expired.length };
    }
    async processContractDueDates() {
        const today = this.today();
        const soon = this.addDays(today, 30);
        const expiring = await this.contracts.find({
            where: {
                endDate: (0, typeorm_2.Between)(today, soon),
                status: (0, typeorm_2.Not)((0, typeorm_2.In)(['expired', 'closed', 'renewed']))
            },
            relations: ['responsibleUser']
        });
        const expired = await this.contracts.find({
            where: {
                endDate: (0, typeorm_2.LessThan)(today),
                status: (0, typeorm_2.Not)((0, typeorm_2.In)(['expired', 'closed', 'renewed']))
            },
            relations: ['responsibleUser']
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
                dedupeKey: `contract-expired:${contract.id}:${today}`
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
                dedupeKey: `contract-soon:${contract.id}:${today}`
            });
        }
        return { expiring: expiring.length, expired: expired.length };
    }
    async processStoppedFlows() {
        const stopped = await this.approvalRequests.find({
            where: {
                status: 'stopped',
                completedAt: MoreThanDate(this.daysAgo(1))
            }
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
                dedupeKey: `approval-stopped:${request.id}`
            });
        }
        return { stopped: stopped.length };
    }
    async processOverdueRfis() {
        const today = this.today();
        const overdue = await this.rfis.find({
            where: {
                dueDate: (0, typeorm_2.LessThan)(today),
                status: (0, typeorm_2.Not)((0, typeorm_2.In)(['closed', 'overdue']))
            },
            relations: ['assignedTo', 'requester']
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
                dedupeKey: `rfi-overdue:${rfi.id}:${today}`
            });
        }
        return { overdue: overdue.length };
    }
    async processPendingObligations() {
        const today = this.today();
        const pending = await this.obligations.find({
            where: {
                commitmentDate: (0, typeorm_2.LessThan)(this.addDays(today, 7)),
                status: (0, typeorm_2.Not)((0, typeorm_2.In)(['completed', 'waived']))
            },
            relations: ['responsibleUser', 'contract']
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
                dedupeKey: `contract-obligation:${obligation.id}:${today}`
            });
        }
        return { pending: pending.length };
    }
    async resolveApprovalRecipients(step) {
        if (!step) {
            return [];
        }
        if (step.approverUserId) {
            const user = await this.users.findOne({ where: { id: step.approverUserId, active: true } });
            return this.toRecipients(user ? [user] : []);
        }
        if (step.approverRoleId) {
            const users = await this.users.find({ relations: ['roles'], where: { active: true } });
            return this.toRecipients(users.filter((user) => user.roles?.some((role) => role.id === step.approverRoleId)));
        }
        return [];
    }
    async registerDelivery(userId, channel, payload, status) {
        if (!payload.dedupeKey) {
            await this.deliveries.save(this.deliveries.create({
                userId,
                channel,
                status,
                subject: payload.title,
                notificationType: payload.notificationType,
                entityType: payload.entityType,
                entityId: payload.entityId
            }));
            return false;
        }
        const existing = await this.deliveries.findOne({ where: { userId, channel, dedupeKey: payload.dedupeKey } });
        if (existing) {
            return true;
        }
        await this.deliveries.save(this.deliveries.create({
            userId,
            channel,
            status,
            subject: payload.title,
            notificationType: payload.notificationType,
            entityType: payload.entityType,
            entityId: payload.entityId,
            dedupeKey: payload.dedupeKey
        }));
        return false;
    }
    async updateDeliveryStatus(userId, channel, dedupeKey, status, errorMessage) {
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
    serialize(notification) {
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
            meta: notification.metaJson ? JSON.parse(notification.metaJson) : null
        };
    }
    buildEmailHtml(name, payload) {
        const appUrl = this.config.get('WEB_APP_URL') ?? this.config.get('WEB_ORIGIN') ?? '';
        const route = payload.meta?.route ? `${appUrl}${payload.meta.route}` : '';
        return [
            `<div style="font-family:Segoe UI,Arial,sans-serif;color:#172033;line-height:1.5">`,
            `<p>Hola ${name},</p>`,
            `<h2 style="margin:0 0 12px;color:#0f766e">${payload.title}</h2>`,
            `<p>${payload.body}</p>`,
            route ? `<p><a href="${route}" style="color:#0f766e">Abrir en Holocron</a></p>` : '',
            `<p style="color:#667085;font-size:12px">Este aviso fue generado por Holocron.</p>`,
            `</div>`
        ].join('');
    }
    toRecipients(users) {
        return users
            .filter((user) => Boolean(user?.id))
            .map((user) => ({ userId: user.id, email: user.email, name: user.name }));
    }
    today() {
        return new Date().toISOString().slice(0, 10);
    }
    addDays(base, days) {
        const date = new Date(`${base}T00:00:00`);
        date.setDate(date.getDate() + days);
        return date.toISOString().slice(0, 10);
    }
    daysAgo(days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date;
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __param(1, (0, typeorm_1.InjectRepository)(notification_preference_entity_1.NotificationPreference)),
    __param(2, (0, typeorm_1.InjectRepository)(notification_delivery_entity_1.NotificationDelivery)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(4, (0, typeorm_1.InjectRepository)(document_entity_1.DocumentRecord)),
    __param(5, (0, typeorm_1.InjectRepository)(approval_request_entity_1.ApprovalRequest)),
    __param(6, (0, typeorm_1.InjectRepository)(approval_step_entity_1.ApprovalStep)),
    __param(7, (0, typeorm_1.InjectRepository)(contract_entity_1.Contract)),
    __param(8, (0, typeorm_1.InjectRepository)(contract_obligation_entity_1.ContractObligation)),
    __param(9, (0, typeorm_1.InjectRepository)(rfi_entity_1.Rfi)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        smtp_mail_service_1.SmtpMailService,
        config_1.ConfigService])
], NotificationsService);
function MoreThanDate(value) {
    return (0, typeorm_2.Not)((0, typeorm_2.LessThan)(value));
}
//# sourceMappingURL=notifications.service.js.map