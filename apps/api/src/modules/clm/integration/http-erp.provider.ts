import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ErpIntegration,
  ErpSyncInvoice,
  ErpSyncPayment,
  ErpSyncResult,
} from './erp-integration.interface';

@Injectable()
export class HttpErpProvider implements ErpIntegration {
  readonly name = 'http';
  readonly configured: boolean;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly invoicePath: string;
  private readonly paymentPath: string;
  private readonly healthPath: string;

  constructor(config: ConfigService) {
    this.baseUrl = (config.get<string>('ERP_BASE_URL') ?? '').replace(/\/$/, '');
    this.apiKey = config.get<string>('ERP_API_KEY') ?? '';
    this.invoicePath = config.get<string>('ERP_INVOICE_PATH') ?? '/invoices';
    this.paymentPath = config.get<string>('ERP_PAYMENT_PATH') ?? '/payments';
    this.healthPath = config.get<string>('ERP_HEALTH_PATH') ?? '/health';
    this.configured = Boolean(this.baseUrl && this.apiKey);
  }

  syncInvoice(data: ErpSyncInvoice): Promise<ErpSyncResult> {
    return this.post(this.invoicePath, data, data.idempotencyKey);
  }

  syncPayment(data: ErpSyncPayment): Promise<ErpSyncResult> {
    return this.post(this.paymentPath, data, data.idempotencyKey);
  }

  async testConnection(): Promise<{ connected: boolean; message: string }> {
    if (!this.configured) {
      return { connected: false, message: 'Faltan ERP_BASE_URL o ERP_API_KEY' };
    }
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}${this.healthPath}`, {
        headers: this.headers(),
      });
      return {
        connected: response.ok,
        message: response.ok ? 'ERP disponible' : `ERP respondió ${response.status}`,
      };
    } catch (error) {
      return {
        connected: false,
        message: error instanceof Error ? error.message : 'ERP no disponible',
      };
    }
  }

  private async post(path: string, data: object, idempotencyKey: string): Promise<ErpSyncResult> {
    if (!this.configured) {
      return { success: false, errorMessage: 'Faltan ERP_BASE_URL o ERP_API_KEY' };
    }
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          ...this.headers(),
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(data),
      });
      const body = (await response.json().catch(() => ({}))) as {
        id?: string;
        externalId?: string;
        message?: string;
      };
      if (!response.ok) {
        return { success: false, errorMessage: body.message ?? `ERP respondió ${response.status}` };
      }
      return { success: true, externalId: body.externalId ?? body.id ?? idempotencyKey };
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'ERP no disponible',
      };
    }
  }

  private headers() {
    return { Authorization: `Bearer ${this.apiKey}`, Accept: 'application/json' };
  }

  private async fetchWithRetry(url: string, init: RequestInit, attempts = 3): Promise<Response> {
    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const response = await fetch(url, init);
        if (response.status !== 429 && response.status < 500) return response;
        lastError = new Error(`ERP respondió ${response.status}`);
      } catch (error) {
        lastError = error;
      }
      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
      }
    }
    throw lastError instanceof Error ? lastError : new Error('ERP no disponible');
  }
}
