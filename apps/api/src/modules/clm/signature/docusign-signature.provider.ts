import { createHmac, createPrivateKey, sign, timingSafeEqual } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SignatureProvider,
  SignatureSendRequest,
  SignatureSendResponse,
  SignatureStatusResponse,
  SignatureWebhookResponse,
} from './signature-provider.interface';

@Injectable()
export class DocuSignSignatureProvider implements SignatureProvider {
  readonly name = 'docusign';
  readonly configured: boolean;
  private readonly logger = new Logger(DocuSignSignatureProvider.name);
  private readonly baseUrl: string;
  private readonly accountId: string;
  private readonly clientId: string;
  private readonly privateKey: string;
  private readonly userId: string;
  private readonly authServer: string;
  private readonly webhookSecret: string;
  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = config.get<string>('DOCUSIGN_BASE_URL') ?? 'https://demo.docusign.net/restapi';
    this.accountId = config.get<string>('DOCUSIGN_ACCOUNT_ID') ?? '';
    this.clientId = config.get<string>('DOCUSIGN_CLIENT_ID') ?? '';
    this.privateKey = config.get<string>('DOCUSIGN_PRIVATE_KEY') ?? '';
    this.userId = config.get<string>('DOCUSIGN_USER_ID') ?? '';
    this.authServer = config.get<string>('DOCUSIGN_AUTH_SERVER') ?? 'account-d.docusign.com';
    this.webhookSecret = config.get<string>('DOCUSIGN_WEBHOOK_HMAC_SECRET') ?? '';
    this.configured = Boolean(
      this.accountId && this.clientId && this.privateKey && this.userId && this.webhookSecret
    );
  }

  async send(request: SignatureSendRequest): Promise<SignatureSendResponse> {
    const token = await this.getAccessToken();
    const envelope = this.buildEnvelope(request);
    const url = `${this.baseUrl}/v2.1/accounts/${this.accountId}/envelopes`;

    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(envelope),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DocuSign error al crear envelope: ${response.status} ${error}`);
    }

    const result = (await response.json()) as {
      envelopeId: string;
      status: string;
    };

    return {
      providerRequestId: result.envelopeId,
      status: this.mapDocuSignStatus(result.status),
      signingUrl: `${this.baseUrl}/v2.1/accounts/${this.accountId}/envelopes/${result.envelopeId}/views/recipient`,
    };
  }

  async checkStatus(providerRequestId: string): Promise<SignatureStatusResponse> {
    const token = await this.getAccessToken();
    const url = `${this.baseUrl}/v2.1/accounts/${this.accountId}/envelopes/${providerRequestId}`;

    const response = await this.fetchWithRetry(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      return { providerRequestId, status: 'not_found', signers: [] };
    }

    const result = (await response.json()) as {
      status: string;
      completedDateTime?: string;
      recipients?: {
        signers?: Array<{
          name: string;
          email: string;
          status: string;
          signedDateTime?: string;
        }>;
      };
    };

    const signers =
      result.recipients?.signers?.map((s) => ({
        name: s.name,
        email: s.email,
        signedAt: s.signedDateTime ? new Date(s.signedDateTime) : undefined,
      })) ?? [];

    return {
      providerRequestId,
      status: this.mapDocuSignStatus(result.status),
      signedAt: result.completedDateTime ? new Date(result.completedDateTime) : undefined,
      signers,
    };
  }

  async cancel(providerRequestId: string): Promise<void> {
    const token = await this.getAccessToken();
    const url = `${this.baseUrl}/v2.1/accounts/${this.accountId}/envelopes/${providerRequestId}`;

    const response = await this.fetchWithRetry(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'voided', voidedReason: 'Cancelado por el usuario' }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DocuSign error al cancelar: ${response.status} ${error}`);
    }
  }

  async handleWebhook(payload: Record<string, unknown>): Promise<SignatureWebhookResponse> {
    const docuSignPayload = payload as {
      envelopeId?: string;
      envelope_id?: string;
      status?: string;
      completedDateTime?: string;
      completed_date_time?: string;
      data?: {
        envelopeSummary?: {
          envelopeId?: string;
          status?: string;
          completedDateTime?: string;
        };
      };
    };
    const summary = docuSignPayload.data?.envelopeSummary;
    const envelopeId =
      docuSignPayload.envelopeId ?? docuSignPayload.envelope_id ?? summary?.envelopeId ?? '';
    const status = docuSignPayload.status ?? summary?.status ?? '';
    const completedDateTime =
      docuSignPayload.completedDateTime ??
      docuSignPayload.completed_date_time ??
      summary?.completedDateTime;

    return {
      envelopeId,
      status: this.mapDocuSignStatus(status),
      signedAt: completedDateTime ? new Date(completedDateTime) : undefined,
    };
  }

  verifyWebhook(rawBody: Buffer, signature: string) {
    if (!this.webhookSecret || !signature) return false;
    const expected = createHmac('sha256', this.webhookSecret).update(rawBody).digest();
    let received: Buffer;
    try {
      received = Buffer.from(signature, 'base64');
    } catch {
      return false;
    }
    return received.length === expected.length && timingSafeEqual(received, expected);
  }

  private buildEnvelope(request: SignatureSendRequest): Record<string, unknown> {
    const base64Content = request.documentBase64.includes('base64,')
      ? request.documentBase64.split('base64,')[1]
      : request.documentBase64;

    return {
      emailSubject: `Firma de contrato - ${request.fileName}`,
      emailBlurb: 'Has sido invitado a firmar este documento.',
      status: 'sent',
      documents: [
        {
          documentBase64: base64Content,
          name: request.fileName,
          fileExtension: request.fileName.split('.').pop() ?? 'pdf',
          documentId: '1',
        },
      ],
      recipients: {
        signers: request.signers.map((signer, index) => ({
          email: signer.email,
          name: signer.name,
          recipientId: String(index + 1),
          routingOrder: String(index + 1),
          tabs: {
            signHereTabs: [
              {
                documentId: '1',
                pageNumber: '1',
                xPosition: '100',
                yPosition: '700',
              },
            ],
          },
        })),
      },
      eventNotification: {
        url: `${this.config.get<string>('API_BASE_URL') ?? 'http://localhost:3001'}/api/clm/signatures/webhook/docusign`,
        loggingEnabled: 'true',
        requireAcknowledgment: 'true',
        includeHMAC: this.webhookSecret ? 'true' : 'false',
        envelopeEvents: [
          { envelopeEventStatusCode: 'completed' },
          { envelopeEventStatusCode: 'declined' },
          { envelopeEventStatusCode: 'voided' },
        ],
      },
      ...(request.expiresAt
        ? {
            notification: {
              reminders: {
                reminderEnabled: 'true',
                reminderDelay: '2',
                reminderFrequency: '3',
              },
              expirations: {
                expireEnabled: 'true',
                expireAfter: '30',
                expireWarn: '5',
              },
            },
          }
        : {}),
    };
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    if (!this.privateKey || !this.clientId || !this.userId) {
      throw new Error(
        'DocuSign no configurado. Defina DOCUSIGN_PRIVATE_KEY, DOCUSIGN_CLIENT_ID y DOCUSIGN_USER_ID'
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const jwtPayload = {
      iss: this.clientId,
      sub: this.userId,
      aud: this.authServer,
      iat: now,
      exp: now + 3600,
      scope: 'signature impersonation',
    };

    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify(jwtPayload)).toString('base64url');
    const signingInput = `${header}.${payload}`;

    const privateKey = createPrivateKey(
      this.privateKey.startsWith('-----BEGIN')
        ? this.privateKey
        : Buffer.from(this.privateKey, 'base64').toString('utf8')
    );

    const signature = sign(null, Buffer.from(signingInput), privateKey);
    const jwt = `${signingInput}.${signature.toString('base64url')}`;

    const tokenResponse = await this.fetchWithRetry(`https://${this.authServer}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`DocuSign token error: ${tokenResponse.status} ${error}`);
    }

    const tokenResult = (await tokenResponse.json()) as {
      access_token: string;
      expires_in: number;
    };

    this.accessToken = tokenResult.access_token;
    this.tokenExpiresAt = Date.now() + (tokenResult.expires_in - 60) * 1000;
    return this.accessToken!;
  }

  private mapDocuSignStatus(docusignStatus: string): string {
    const map: Record<string, string> = {
      sent: 'sent',
      delivered: 'sent',
      completed: 'completed',
      declined: 'declined',
      voided: 'cancelled',
      expired: 'expired',
    };
    return map[docusignStatus.toLowerCase()] ?? 'pending';
  }

  private async fetchWithRetry(url: string, init: RequestInit, attempts = 3): Promise<Response> {
    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const response = await fetch(url, init);
        if (response.status !== 429 && response.status < 500) return response;
        lastError = new Error(`DocuSign respondió ${response.status}`);
      } catch (error) {
        lastError = error;
      }

      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
      }
    }

    this.logger.error('DocuSign no respondió después de varios intentos', lastError);
    throw lastError instanceof Error ? lastError : new Error('DocuSign no disponible');
  }
}
