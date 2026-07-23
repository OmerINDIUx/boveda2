import { Injectable } from '@nestjs/common';
import {
  ErpIntegration,
  ErpSyncInvoice,
  ErpSyncPayment,
  ErpSyncResult,
} from './erp-integration.interface';

@Injectable()
export class StubErpProvider implements ErpIntegration {
  readonly name = 'stub';
  readonly configured = true;

  async syncInvoice(_data: ErpSyncInvoice): Promise<ErpSyncResult> {
    return { success: true, externalId: `ERP-INV-${Date.now()}` };
  }

  async syncPayment(_data: ErpSyncPayment): Promise<ErpSyncResult> {
    return { success: true, externalId: `ERP-PAY-${Date.now()}` };
  }

  async testConnection(): Promise<{ connected: boolean; message: string }> {
    return { connected: true, message: 'Stub ERP conectado correctamente (modo simulación).' };
  }
}
