export interface ErpSyncInvoice {
  invoiceNumber: string;
  contractName: string;
  amount: string;
  currency: string;
  issuedAt: string;
  dueAt: string;
}

export interface ErpSyncPayment {
  contractName: string;
  concept: string;
  amount: string;
  currency: string;
  paidAt: string;
}

export interface ErpSyncResult {
  success: boolean;
  externalId?: string;
  errorMessage?: string;
}

export interface ErpIntegration {
  syncInvoice(data: ErpSyncInvoice): Promise<ErpSyncResult>;
  syncPayment(data: ErpSyncPayment): Promise<ErpSyncResult>;
  testConnection(): Promise<{ connected: boolean; message: string }>;
}
