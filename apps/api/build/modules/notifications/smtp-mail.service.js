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
var SmtpMailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmtpMailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const node_net_1 = require("node:net");
const node_tls_1 = require("node:tls");
let SmtpMailService = SmtpMailService_1 = class SmtpMailService {
    config;
    logger = new common_1.Logger(SmtpMailService_1.name);
    constructor(config) {
        this.config = config;
    }
    async send(payload) {
        const host = this.config.get('SMTP_HOST');
        const from = this.config.get('SMTP_FROM');
        if (!host || !from) {
            this.logger.log(`Correo omitido para ${payload.to}: SMTP_HOST o SMTP_FROM no configurados.`);
            return { status: 'skipped', message: 'SMTP no configurado' };
        }
        const port = Number(this.config.get('SMTP_PORT') ?? 465);
        const secure = String(this.config.get('SMTP_SECURE') ?? 'true') === 'true';
        const username = this.config.get('SMTP_USER');
        const password = this.config.get('SMTP_PASSWORD');
        const socket = await this.connect(host, port, secure);
        try {
            await this.expect(socket, 220);
            await this.command(socket, `EHLO ${this.config.get('SMTP_HELO') ?? 'holocron.local'}`, 250);
            if (username && password) {
                await this.command(socket, 'AUTH LOGIN', 334);
                await this.command(socket, Buffer.from(username).toString('base64'), 334);
                await this.command(socket, Buffer.from(password).toString('base64'), 235);
            }
            await this.command(socket, `MAIL FROM:<${from}>`, 250);
            await this.command(socket, `RCPT TO:<${payload.to}>`, [250, 251]);
            await this.command(socket, 'DATA', 354);
            await this.sendData(socket, this.composeMessage(from, payload));
            await this.expect(socket, 250);
            await this.command(socket, 'QUIT', 221);
            return { status: 'sent' };
        }
        finally {
            socket.destroy();
        }
    }
    connect(host, port, secure) {
        return new Promise((resolve, reject) => {
            const socket = secure ? (0, node_tls_1.connect)({ host, port, servername: host }) : (0, node_net_1.connect)({ host, port });
            socket.once('error', reject);
            socket.once('connect', () => resolve(socket));
        });
    }
    composeMessage(from, payload) {
        const lines = [
            `From: Holocron <${from}>`,
            `To: <${payload.to}>`,
            `Subject: ${payload.subject}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            '',
            payload.html ?? `<pre>${this.escapeHtml(payload.text)}</pre>`
        ];
        return `${lines.join('\r\n')}\r\n.\r\n`;
    }
    escapeHtml(value) {
        return value
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;');
    }
    sendData(socket, payload) {
        return new Promise((resolve, reject) => {
            socket.write(payload, (error) => {
                if (error)
                    reject(error);
                else
                    resolve();
            });
        });
    }
    async command(socket, command, expected) {
        await this.write(socket, `${command}\r\n`);
        await this.expect(socket, expected);
    }
    write(socket, chunk) {
        return new Promise((resolve, reject) => {
            socket.write(chunk, (error) => {
                if (error)
                    reject(error);
                else
                    resolve();
            });
        });
    }
    expect(socket, expected) {
        const allowed = Array.isArray(expected) ? expected : [expected];
        return new Promise((resolve, reject) => {
            const onData = (buffer) => {
                const response = buffer.toString('utf8');
                const code = Number(response.slice(0, 3));
                cleanup();
                if (allowed.includes(code)) {
                    resolve(response);
                }
                else {
                    reject(new Error(`SMTP ${code}: ${response.trim()}`));
                }
            };
            const onError = (error) => {
                cleanup();
                reject(error);
            };
            const cleanup = () => {
                socket.off('data', onData);
                socket.off('error', onError);
            };
            socket.once('data', onData);
            socket.once('error', onError);
        });
    }
};
exports.SmtpMailService = SmtpMailService;
exports.SmtpMailService = SmtpMailService = SmtpMailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SmtpMailService);
//# sourceMappingURL=smtp-mail.service.js.map