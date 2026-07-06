import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Socket, connect } from 'node:net';
import { TLSSocket, connect as connectTls } from 'node:tls';

type MailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

@Injectable()
export class SmtpMailService {
  private readonly logger = new Logger(SmtpMailService.name);

  constructor(private readonly config: ConfigService) {}

  async send(payload: MailPayload) {
    const host = this.config.get<string>('SMTP_HOST');
    const from = this.config.get<string>('SMTP_FROM');
    if (!host || !from) {
      this.logger.log(`Correo omitido para ${payload.to}: SMTP_HOST o SMTP_FROM no configurados.`);
      return { status: 'skipped' as const, message: 'SMTP no configurado' };
    }

    const port = Number(this.config.get<string>('SMTP_PORT') ?? 465);
    const secure = String(this.config.get<string>('SMTP_SECURE') ?? 'true') === 'true';
    const username = this.config.get<string>('SMTP_USER');
    const password = this.config.get<string>('SMTP_PASSWORD');

    const socket = await this.connect(host, port, secure);
    try {
      await this.expect(socket, 220);
      await this.command(
        socket,
        `EHLO ${this.config.get<string>('SMTP_HELO') ?? 'holocron.local'}`,
        250
      );

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
      return { status: 'sent' as const };
    } finally {
      socket.destroy();
    }
  }

  private connect(host: string, port: number, secure: boolean): Promise<Socket | TLSSocket> {
    return new Promise((resolve, reject) => {
      const socket = secure
        ? connectTls({ host, port, servername: host })
        : connect({ host, port });
      socket.once('error', reject);
      socket.once('connect', () => resolve(socket));
    });
  }

  private composeMessage(from: string, payload: MailPayload) {
    const lines = [
      `From: Holocron <${from}>`,
      `To: <${payload.to}>`,
      `Subject: ${payload.subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      '',
      payload.html ?? `<pre>${this.escapeHtml(payload.text)}</pre>`,
    ];
    return `${lines.join('\r\n')}\r\n.\r\n`;
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  private sendData(socket: Socket | TLSSocket, payload: string) {
    return new Promise<void>((resolve, reject) => {
      socket.write(payload, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  private async command(socket: Socket | TLSSocket, command: string, expected: number | number[]) {
    await this.write(socket, `${command}\r\n`);
    await this.expect(socket, expected);
  }

  private write(socket: Socket | TLSSocket, chunk: string) {
    return new Promise<void>((resolve, reject) => {
      socket.write(chunk, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  private expect(socket: Socket | TLSSocket, expected: number | number[]) {
    const allowed = Array.isArray(expected) ? expected : [expected];
    return new Promise<string>((resolve, reject) => {
      const onData = (buffer: Buffer) => {
        const response = buffer.toString('utf8');
        const code = Number(response.slice(0, 3));
        cleanup();
        if (allowed.includes(code)) {
          resolve(response);
        } else {
          reject(new Error(`SMTP ${code}: ${response.trim()}`));
        }
      };
      const onError = (error: Error) => {
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
}
