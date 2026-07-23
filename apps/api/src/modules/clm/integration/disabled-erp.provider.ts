import {
  ErpIntegration,
  ErpSyncInvoice,
  ErpSyncPayment,
  ErpSyncResult,
} from './erp-integration.interface';

export class DisabledErpProvider implements ErpIntegration {
  readonly name = 'disabled';
  readonly configured = false;

  syncInvoice(_data: ErpSyncInvoice): Promise<ErpSyncResult> {
    return Promise.resolve({
      success: false,
      errorMessage: 'La integración ERP no está configurada',
    });
  }

  syncPayment(_data: ErpSyncPayment): Promise<ErpSyncResult> {
    return Promise.resolve({
      success: false,
      errorMessage: 'La integración ERP no está configurada',
    });
  }

  testConnection(): Promise<{ connected: boolean; message: string }> {
    return Promise.resolve({ connected: false, message: 'La integración ERP no está configurada' });
  }
}
