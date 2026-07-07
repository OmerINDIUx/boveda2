export type ReportType =
  | 'contracts_by_status'
  | 'contracts_by_type'
  | 'expiration_forecast'
  | 'obligations_summary'
  | 'payments_summary'
  | 'financial_overview';

export interface ReportRequest {
  type: ReportType;
  projectId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ReportRow {
  label: string;
  value: number;
  metadata?: Record<string, unknown>;
}

export interface ReportResult {
  type: ReportType;
  title: string;
  generatedAt: string;
  rows: ReportRow[];
  total: number;
}
